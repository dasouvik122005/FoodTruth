import os
import json
import re
import time
from pydantic import ValidationError
from google import genai
from google.genai import types
from google.genai.errors import APIError
from models import ExtractionResult

EXTRACTION_PROMPT = """
You are a regulatory and nutritional OCR extractor.
Audit the provided food packaging images (Front and Back).
Examine both images carefully. Search for any nutrition numbers, tables, per-100g or per-serving values, and ingredient lists across either photo. Mark has_nutrition_table=true if any nutritional facts are visible anywhere on either packaging image.
If any nutritional value (such as polyols, added sugars, or per-serving metrics) is not stated on the package, default its value to 0.0 rather than null or None.
Return ONLY a valid JSON object matching this schema:
{
  "status": "SUCCESS | BLURRY | NOT_PACKAGING | MISSING_PANEL",
  "rejection_reason": null or "string describing the issue",
  "data": {
    "product_name": "string",
    "serving_size": {"value": float, "unit": "g | ml"},
    "front_claims": ["list of strings"],
    "disease_or_medicinal_claims": ["list of strings claiming cure, remission, or treatment of diseases"],
    "has_nutrition_table": boolean,
    "has_ingredient_list": boolean,
    "macros_per_serving": {
      "energy_kcal": float,
      "protein_g": float,
      "total_carbs_g": float,
      "total_sugars_g": float,
      "added_sugars_g": float,
      "polyols_g": float,
      "total_fat_g": float
    },
    "ingredients_raw": ["ordered list of strings"],
    "parenthetical_sub_ingredients": [
      {"parent": "string", "sub_ingredients": ["list of strings"]}
    ]
  }
}
"""

def clean_and_parse_json(raw_text: str) -> dict:
    text = raw_text.strip()
    # Strip markdown code blocks if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return json.loads(text.strip())

def extract_label_data(api_key: str, front_bytes: bytes, back_bytes: bytes, model_name: str = None) -> ExtractionResult:
    if not api_key:
        raise ValueError("API Key is missing.")

    if model_name:
        CANDIDATE_MODELS = [model_name]
    else:
        # Model cascade order:
        CANDIDATE_MODELS = [
            os.getenv("FOODTRUTH_MODEL", "gemma-4-26b-a4b-it"),
            "gemma-4-31b-it"
        ]

    try:
        client = genai.Client(api_key=api_key)
        
        contents = []
        if front_bytes:
            contents.append(types.Part.from_bytes(data=front_bytes, mime_type="image/jpeg"))
        if back_bytes:
            contents.append(types.Part.from_bytes(data=back_bytes, mime_type="image/jpeg"))
            
        if not contents:
            return ExtractionResult(status="MISSING_PANEL", rejection_reason="No images provided.")

        contents.append(types.Part.from_text(text=EXTRACTION_PROMPT))

        response = None
        for current_model in CANDIDATE_MODELS:
            try:
                response = client.models.generate_content(
                    model=current_model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    )
                )
                break
            except APIError as e:
                err_str = str(e).lower()
                if "503" in err_str or "unavailable" in err_str or "servererror" in err_str or "500" in err_str or "404" in err_str or "not found" in err_str:
                    print(f"Model {current_model} failed with error: {e}. Trying next candidate...")
                    continue
                else:
                    raise
                    
        if not response:
            return ExtractionResult(status="PARSE_ERROR", rejection_reason="All candidate models failed.")
        
        parsed_data = clean_and_parse_json(response.text)
        
        def sanitize_none_to_zero(obj, in_macros=False):
            if isinstance(obj, dict):
                return {k: sanitize_none_to_zero(v, in_macros=(in_macros or k in ["macros_per_serving", "serving_size"])) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize_none_to_zero(v, in_macros) for v in obj]
            elif obj is None and in_macros:
                return 0.0
            return obj
            
        clean_data = sanitize_none_to_zero(parsed_data)
        return ExtractionResult.model_validate(clean_data)

    except ValidationError as e:
        print(f"Validation Error: {e}")
        return ExtractionResult(status="PARSE_ERROR", rejection_reason=f"Failed to parse model output into schema: {str(e)}")
    except APIError as e:
        print(f"API Error: {e}")
        if "policy" in str(e).lower() or "blocked" in str(e).lower():
             return ExtractionResult(status="BLOCKED", rejection_reason="Model blocked prompt due to content policy.")
        raise
    except Exception as e:
        print(f"Unknown Error: {e}")
        return ExtractionResult(status="PARSE_ERROR", rejection_reason=f"Unknown error: {str(e)}")
