import os
import json
from pydantic import ValidationError
from google import genai
from google.genai import types
from google.genai.errors import APIError
from models import ExtractionResult

EXTRACTION_PROMPT = """
You are a structured OCR agent for food packaging. Your only job is to extract raw text and numbers from the images into the exact JSON schema provided. 
Never calculate, infer, or evaluate anything. Never paraphrase ingredient names — copy them verbatim from the label.
Ensure you validate whether the images actually contain food packaging with readable ingredient and nutrition panels before extracting data.

Schema to extract:
{
  "status": "SUCCESS | BLURRY | NOT_PACKAGING | MISSING_MANDATORY_PANEL",
  "rejection_reason": "string or null",
  "data": {
    "product_name": "string",
    "serving_size": {"value": float, "unit": "g | ml"},
    "front_claims": ["list of exact strings"],
    "macros_per_serving": {
      "energy_kcal": float,
      "protein_g": float,
      "total_carbs_g": float,
      "total_sugars_g": float,
      "added_sugars_g": float,
      "polyols_g": float,
      "total_fat_g": float,
      "saturated_fat_g": float,
      "dietary_fiber_g": float
    },
    "ingredients_raw": ["ordered list of lowercase ingredient strings"],
    "parenthetical_sub_ingredients": [
      {"parent": "string", "sub_ingredients": ["list of strings"]}
    ],
    "disease_or_medicinal_claims": [
      "exact strings claiming cure, reversal, remission, prevention, or treatment of diseases like diabetes, hypertension, PCOS, etc."
    ],
    "has_nutrition_table": boolean,
    "has_ingredient_list": boolean
  }
}
"""

def extract_label_data(api_key: str, front_bytes: bytes, back_bytes: bytes, model_name: str = None) -> ExtractionResult:
    if not api_key:
        raise ValueError("API Key is missing.")

    if model_name is None:
        model_name = os.environ.get("FOODTRUTH_MODEL", "gemma-4-27b-it")

    try:
        client = genai.Client(api_key=api_key)
        
        contents = []
        if front_bytes:
            contents.append(types.Part.from_bytes(data=front_bytes, mime_type="image/jpeg"))
        if back_bytes:
            contents.append(types.Part.from_bytes(data=back_bytes, mime_type="image/jpeg"))
            
        if not contents:
            return ExtractionResult(status="MISSING_MANDATORY_PANEL", rejection_reason="No images provided.")

        contents.append(types.Part.from_text(text=EXTRACTION_PROMPT))

        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.0,
                max_output_tokens=2048,
            )
        )
        
        raw_json = response.text
        # Clean up possible markdown formatting
        if raw_json.startswith("```json"):
            raw_json = raw_json[7:]
        if raw_json.endswith("```"):
            raw_json = raw_json[:-3]
            
        parsed_data = json.loads(raw_json)
        return ExtractionResult.model_validate(parsed_data)

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
