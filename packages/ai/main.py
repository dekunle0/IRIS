from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
import uvicorn
import os

app = FastAPI(title="IRIS Local AI Service")

# Authentication Dependency (IRIS-H-093)
def verify_token(authorization: str = Header(None)):
    expected_token = os.environ.get('IRIS_AI_TOKEN')
    if expected_token is None:
        # If running stand-alone outside desktop app without token, we reject.
        raise HTTPException(status_code=401, detail="Missing IRIS_AI_TOKEN configuration in environment.")
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
        
    token = authorization.replace("Bearer ", "")
    if token != expected_token:
        raise HTTPException(status_code=403, detail="Forbidden")

class AnalysePayload(BaseModel):
    capture_id: str
    capture_path: str
    output_dir: str
    test_type: str
    patient_context: dict

@app.get("/health")
def health():
    return {"status": "ok", "mode": "local"}

@app.get("/version")
def version():
    # IRIS-H-094
    from services.pipeline import get_model_checksum
    return {
        "model_version": "v1.0.0-int8",
        "model_checksum": get_model_checksum(),
        "provider": "ONNX Runtime (CPU/DML/CoreML)",
        "status": "ok"
    }

@app.post("/analyse", dependencies=[Depends(verify_token)])
def analyse(payload: AnalysePayload):
    from services.pipeline import run_pipeline
    return run_pipeline(payload.capture_id, payload.capture_path, payload.output_dir, payload.test_type, payload.patient_context)

if __name__ == "__main__":
    parent_pid = os.environ.get('IRIS_DESKTOP_PID')
    if parent_pid:
        import threading, time
        import psutil
        def watchdog():
            while True:
                try:
                    if not psutil.pid_exists(int(parent_pid)):
                        os._exit(0)
                except:
                    pass
                time.sleep(2)
        threading.Thread(target=watchdog, daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=8005)