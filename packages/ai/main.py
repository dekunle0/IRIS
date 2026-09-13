# packages/ai/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="IRIS Local AI Service")

# This tells FastAPI to expect a JSON body matching this exact structure
class AnalysePayload(BaseModel):
    capture_path: str
    test_type: str
    patient_context: dict

@app.get("/health")
def health():
    return {"status": "ok", "mode": "local"}

@app.post("/analyse")
def analyse(payload: AnalysePayload):
    from services.pipeline import run_pipeline
    return run_pipeline(payload.capture_path, payload.test_type, payload.patient_context)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)