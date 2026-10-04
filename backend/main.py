from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()
from extractor import extract_label_data
from rules import run_audits
from models import AuditResult
from samples import SAMPLES

app = FastAPI(title="FoodTruth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/samples")
async def get_samples():
    return list(SAMPLES.keys())

@app.post("/api/audit/demo", response_model=AuditResult)
async def audit_demo(payload_name: str = Form(...)):
    if payload_name not in SAMPLES:
        raise HTTPException(status_code=404, detail="Demo sample not found")
        
    ext_res = SAMPLES[payload_name]
    if ext_res.status == "SUCCESS":
        return run_audits(ext_res.data)
    else:
        raise HTTPException(status_code=400, detail=ext_res.rejection_reason)

@app.post("/api/audit/upload", response_model=AuditResult)
async def audit_upload(
    front_image: Optional[UploadFile] = File(None),
    back_image: Optional[UploadFile] = File(None),
    x_api_key: Optional[str] = Header(None)
):
    api_key = x_api_key or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API Key. Please provide x-api-key header.")
        
    if not front_image and not back_image:
        raise HTTPException(status_code=400, detail="Must provide at least one image.")
        
    front_bytes = await front_image.read() if front_image else None
    back_bytes = await back_image.read() if back_image else None
    
    try:
        ext_res = extract_label_data(api_key, front_bytes, back_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Extraction failed: {str(e)}")
        
    if ext_res.status == "SUCCESS":
        return run_audits(ext_res.data)
    else:
        # Pass the exact status back to the frontend for the Recovery Card
        raise HTTPException(status_code=422, detail={"status": ext_res.status, "reason": ext_res.rejection_reason})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
