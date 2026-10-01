import os
os.environ['OMP_NUM_THREADS'] = '2'
os.environ['MKL_NUM_THREADS'] = '2'

import time
import cv2
import sys
import hashlib
import numpy as np
from scipy import ndimage
import onnxruntime as ort
from services.report import generate_local_comment

if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

MODEL_PATH = os.path.join(base_path, 'models/iris_parasitology_mp_v1_int8.onnx')
_ort_session = None
_model_checksum = None

def get_session():
    global _ort_session, _model_checksum
    if _ort_session is None:
        if not os.path.exists(MODEL_PATH):
            print(f"\n CRITICAL: Physical ONNX Model not found at {MODEL_PATH}.")
            return None
        
        # Calculate checksum for provenance (IRIS-H-084)
        with open(MODEL_PATH, "rb") as f:
            _model_checksum = hashlib.sha256(f.read()).hexdigest()
            
        _ort_session = ort.InferenceSession(
            MODEL_PATH, 
            providers=['CoreMLExecutionProvider', 'DmlExecutionProvider', 'CPUExecutionProvider']
        )
    return _ort_session

def get_model_checksum():
    return _model_checksum

def preprocess_crop(crop):
    img = cv2.resize(crop, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img = (img - mean) / std
    img = np.transpose(img, (2, 0, 1))
    return np.expand_dims(img, axis=0).astype(np.float32)

def compute_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    iou = interArea / float(boxAArea + boxBArea - interArea) if (boxAArea + boxBArea - interArea) > 0 else 0
    return iou

def resize_frame_if_needed(frame):
    h, w = frame.shape[:2]
    if w > 1920:
        scale = 1920 / w
        return cv2.resize(frame, (1920, int(h * scale)))
    return frame

def run_pipeline(capture_id: str, capture_path: str, output_dir: str, test_type: str, patient_context: dict):
    # Prevent directory traversal in output_dir (IRIS-H-092)
    if ".." in output_dir or output_dir.startswith("/"):
        return {"status": "error", "reason": "Invalid output directory."}
        
    if "WBC" in test_type or "Differential" in test_type:
        return {
            "status": "unable_to_analyse",
            "reason": "WBC Differential model is currently disabled pending integration."
        }

    try:
        session = get_session()
        if session is None:
            return {"status": "unable_to_analyse", "reason": "Physical AI model missing."}
        input_name = session.get_inputs()[0].name
    except Exception as e:
        return {"status": "error", "reason": str(e)}

    extracted_frames = []
    if os.path.exists(capture_path):
        # Image fallback check
        if capture_path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff')):
            img = cv2.imread(capture_path)
            if img is not None:
                img = resize_frame_if_needed(img)
                extracted_frames.append(img)
        else:
            # It's a video
            cap = cv2.VideoCapture(capture_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps <= 0 or fps > 120: fps = 30
            total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            duration_seconds = total_frames / fps if total_frames > 0 else 30
            max_read_frames = int(duration_seconds * fps)
            
            all_frames = []
            frame_count = 0
            while cap.isOpened() and frame_count < max_read_frames:
                ret, frame = cap.read()
                if not ret: break
                all_frames.append(frame)
                frame = resize_frame_if_needed(frame)
                if cv2.Laplacian(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var() > 80:
                    extracted_frames.append(frame)
                frame_count += 1
            cap.release()
            
            # Fallback: if no sharp frames found, sample evenly
            if len(extracted_frames) < 75 and len(all_frames) > 0:
                extracted_frames = []
                step = max(1, len(all_frames) // 75)
                for i in range(0, len(all_frames), step):
                    extracted_frames.append(resize_frame_if_needed(all_frames[i]))
                    if len(extracted_frames) >= 75:
                        break

    if len(extracted_frames) < 1:
        return {"status": "unable_to_analyse", "reason": "Provided file could not be read or contains no frames."}

    # Start timing after disk read I/O (IRIS-H-101)
    start_time = time.time()
    
    os.makedirs(output_dir, exist_ok=True)
    frame_paths = []
    # Process up to 3 frames for robust analysis
    for i, frame in enumerate(extracted_frames[:3]):
        path = os.path.join(output_dir, f"{capture_id}_frame_{i+1}.jpg")
        cv2.imwrite(path, frame)
        frame_paths.append(path)

    total_rbc_cells = 0
    parasitised_cells = 0
    confidence_sum = 0.0
    uncertain_cells = 0
    
    # NLM-Malaria Dataset standard ONNX export mapping
    CLASS_PARASITIZED = 0
    CLASS_UNINFECTED = 1
    CLASS_LEUKOCYTE = 2

    for frame_idx, frame in enumerate(extracted_frames[:3]):
        h, w, _ = frame.shape
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 51, 8)
        kernel = np.ones((3,3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        valid_boxes = []
        for c in contours:
            area = cv2.contourArea(c)
            if 300 < area < 3000:
                x, y, bw, bh = cv2.boundingRect(c)
                aspect_ratio = float(bw) / bh
                if 0.7 <= aspect_ratio <= 1.3:
                    valid_boxes.append((max(0, x-15), max(0, y-15), min(w, x+bw+15), min(h, y+bh+15)))
        
        # Intra-frame deduplication only (IRIS-H-090)
        deduped_boxes = []
        for box in valid_boxes:
            is_duplicate = False
            for t_box in deduped_boxes:
                if compute_iou(box, t_box) > 0.5:
                    is_duplicate = True
                    break
            if not is_duplicate:
                deduped_boxes.append(box)
                
        cell_indices = list(range(len(deduped_boxes)))
        if len(cell_indices) > 40:
            import random
            rng = random.Random(f"{capture_id}_{frame_idx}")
            cell_indices = rng.sample(cell_indices, 40)
            
        batch_tensors = []
        for i in cell_indices:
            x_min, y_min, x_max, y_max = deduped_boxes[i]
            crop = frame[y_min:y_max, x_min:x_max]
            if crop.size > 0:
                batch_tensors.append(preprocess_crop(crop))
                
        if not batch_tensors:
            continue
            
        # Run inference iteratively since model expects batch size 1
        logits_batch = []
        for tensor in batch_tensors:
            outputs = session.run(None, {input_name: tensor})
            logits_batch.append(outputs[0][0])
            
        for logits in logits_batch:
            exp_logits = np.exp(logits - np.max(logits))
            probs = exp_logits / exp_logits.sum()
            pred_class = np.argmax(probs)
            max_prob = float(np.max(probs))
            
            if max_prob < 0.70:
                uncertain_cells += 1
                
            # Distinguish RBCs from Leukocytes (IRIS-H-088)
            if pred_class == CLASS_PARASITIZED and "Parasite" in test_type:
                parasitised_cells += 1
                total_rbc_cells += 1
            elif pred_class == CLASS_UNINFECTED:
                total_rbc_cells += 1
                
            confidence_sum += max_prob

    if total_rbc_cells == 0:
        return {
            "status": "unable_to_analyse",
            "reason": "No valid RBCs were detected in the provided fields of view. This could indicate an empty slide, poor optical focusing, or an invalid sample preparation."
        }

    parasitaemia_pct = round((parasitised_cells / total_rbc_cells) * 100, 2)
    avg_confidence = round(confidence_sum / (total_rbc_cells if total_rbc_cells > 0 else 1), 2)
    uncertain_cells_pct = round((uncertain_cells / total_rbc_cells) * 100, 2)
    
    # Map back to canonical test type (IRIS-H-087)
    canonical_test_type = "parasitology_malaria_parasite" if "Parasite" in test_type else test_type

    findings_dict = {
        "test_type": canonical_test_type,
        "total_cells": total_rbc_cells,
        "parasitaemia_pct": parasitaemia_pct,
        "severity": "High" if parasitaemia_pct > 5.0 else ("Moderate" if parasitaemia_pct > 1.0 else "Low"),
        "by_class": {
            "parasitised_rbc": parasitised_cells,
            "uninfected_rbc": total_rbc_cells - parasitised_cells
        },
        "overall_confidence": avg_confidence,
        "frame_paths": frame_paths
    }

    findings_dict["interpretive_comment"] = generate_local_comment(findings_dict, canonical_test_type, {}, patient_context)

    return {
        "status": "success",
        "model_version": "v1.0.0-int8",
        "dataset_version": "NLM-Malaria",
        "model_checksum": get_model_checksum(),
        "preprocessing_version": "v2.1.0-cv2",
        "calibration_version": "v1.0.0-ts",
        "segmentation_method": "cv2_adaptive",
        "processing_duration_ms": int((time.time() - start_time) * 1000),
        "findings": findings_dict,
        "confidence_scores": {"overall": avg_confidence},
        "uncertain_cells_pct": uncertain_cells_pct,
        "flagged_for_review": bool(uncertain_cells_pct > 15.0)
    }
