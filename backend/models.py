from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class ServingSize(BaseModel):
    value: Optional[float] = Field(default=0.0)
    unit: Optional[str] = Field(default="g")

class MacrosPerServing(BaseModel):
    energy_kcal: Optional[float] = Field(default=0.0)
    protein_g: Optional[float] = Field(default=0.0)
    total_carbs_g: Optional[float] = Field(default=0.0)
    total_sugars_g: Optional[float] = Field(default=0.0)
    added_sugars_g: Optional[float] = Field(default=0.0)
    polyols_g: Optional[float] = Field(default=0.0)
    total_fat_g: Optional[float] = Field(default=0.0)
    saturated_fat_g: Optional[float] = Field(default=0.0)
    dietary_fiber_g: Optional[float] = Field(default=0.0)

class ParentheticalSubIngredient(BaseModel):
    parent: str
    sub_ingredients: List[str]

class ExtractionData(BaseModel):
    product_name: str
    serving_size: Optional[ServingSize] = Field(default_factory=ServingSize)
    front_claims: List[str]
    macros_per_serving: Optional[MacrosPerServing] = Field(default_factory=MacrosPerServing)
    ingredients_raw: List[str]
    parenthetical_sub_ingredients: List[ParentheticalSubIngredient]
    disease_or_medicinal_claims: List[str] = Field(default_factory=list)
    has_nutrition_table: bool
    has_ingredient_list: bool

class ExtractionResult(BaseModel):
    status: Literal["SUCCESS", "BLURRY", "NOT_PACKAGING", "MISSING_MANDATORY_PANEL", "MISSING_PANEL", "PARSE_ERROR", "BLOCKED"]
    rejection_reason: Optional[str] = None
    data: Optional[ExtractionData] = None

# --- Audit Result Models ---

class SweetenerFlag(BaseModel):
    name: str
    gi_value: int
    classification: str
    is_hidden_sugar: bool

class SweetenerAudit(BaseModel):
    sweeteners_found: List[SweetenerFlag]
    overall_glycemic_risk: Literal["HIGH", "MODERATE", "LOW", "NONE"]
    fssai_misalignment_flagged: bool

class ProteinAudit(BaseModel):
    declared_g: float
    source_tier: str
    true_source: Optional[str] = None
    sprinkle_trick_detected: bool

class PCaloRatio(BaseModel):
    protein_calories: float
    efficiency_pct: float
    classification: str

class DiseaseClaimFlag(BaseModel):
    claim_text: str
    regulation_violated: str
    severity: Literal["CRITICAL"] = "CRITICAL"

class FSSAIViolation(BaseModel):
    rule_reference: str
    description: str

class Verdict(BaseModel):
    overall_label: str
    works_if: List[str]
    wont_work_if: List[str]

class AuditResult(BaseModel):
    status: str = "SUCCESS"
    product_name: str
    serving_size_str: str
    sweetener_audit: SweetenerAudit
    protein_audit: ProteinAudit
    pcal_ratio: PCaloRatio
    disease_claim_flags: List[DiseaseClaimFlag]
    fssai_violations: List[FSSAIViolation]
    verdict: Verdict
    warnings: List[str] = Field(default_factory=list)
