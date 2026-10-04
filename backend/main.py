from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
import os

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

load_dotenv()
from extractor import extract_label_data
from rules import run_audits
from models import AuditResult
from samples import SAMPLES

app = FastAPI(title="FoodTruth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
        if not ext_res.data.has_nutrition_table or not ext_res.data.has_ingredient_list:
            raise HTTPException(status_code=422, detail={"status": "MISSING_PANEL", "reason": "Missing mandatory nutrition table or ingredient list."})
        return run_audits(ext_res.data)
    else:
        raise HTTPException(status_code=400, detail=ext_res.rejection_reason)

@app.post("/api/audit/upload", response_model=AuditResult)
@app.post("/api/audit", response_model=AuditResult)
async def audit_upload(
    request: Request,
    x_api_key: Optional[str] = Header(None)
):
    form = await request.form()
    # Accept multiple common naming conventions
    front_file = form.get("front_image") or form.get("front") or form.get("frontFile")
    back_file = form.get("back_image") or form.get("back") or form.get("backFile")

    if not front_file or not back_file:
        raise HTTPException(
            status_code=400,
            detail="Both front and back packaging images are required."
        )

    front_bytes = await front_file.read()
    back_bytes = await back_file.read()

    api_key = x_api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if api_key:
        os.environ["GEMINI_API_KEY"] = api_key
        os.environ["GOOGLE_API_KEY"] = api_key
        
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API Key. Please provide x-api-key header.")
        
    try:
        ext_res = extract_label_data(api_key, front_bytes, back_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Extraction failed: {str(e)}")
        
    if ext_res.status in ["SUCCESS", "MISSING_PANEL"] and ext_res.data:
        audit_res = run_audits(ext_res.data)
        if ext_res.status == "MISSING_PANEL" or not ext_res.data.has_nutrition_table or not ext_res.data.has_ingredient_list:
            audit_res.status = "MISSING_PANEL"
            audit_res.warnings.append("Nutrition table partially illegible; estimated from available text.")
        else:
            audit_res.status = "SUCCESS"
        return audit_res
    else:
        # Pass the exact status back to the frontend for the Recovery Card
        raise HTTPException(status_code=422, detail={"status": ext_res.status, "reason": ext_res.rejection_reason})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
