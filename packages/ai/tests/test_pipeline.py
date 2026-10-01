import pytest
import numpy as np
from services.pipeline import compute_iou, resize_frame_if_needed, preprocess_crop

def test_compute_iou_identical():
    boxA = [0, 0, 10, 10]
    boxB = [0, 0, 10, 10]
    iou = compute_iou(boxA, boxB)
    assert iou == 1.0

def test_compute_iou_no_overlap():
    boxA = [0, 0, 10, 10]
    boxB = [20, 20, 30, 30]
    iou = compute_iou(boxA, boxB)
    assert iou == 0.0

def test_resize_frame_if_needed():
    # Large frame
    large = np.zeros((2000, 3000, 3), dtype=np.uint8)
    resized = resize_frame_if_needed(large)
    
    # Should maintain aspect ratio, max 1080p width
    assert resized.shape[1] <= 1920

def test_preprocess_crop():
    crop = np.zeros((100, 100, 3), dtype=np.uint8)
    tensor = preprocess_crop(crop)
    
    # Check dimensions for model input (B, C, H, W)
    assert len(tensor.shape) == 4
    assert tensor.shape[1] == 3 # Channels
