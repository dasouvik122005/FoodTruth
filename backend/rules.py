import re
from typing import List, Tuple
from models import (
    ExtractionData, AuditResult, SweetenerFlag, SweetenerAudit, 
    ProteinAudit, PCaloRatio, DiseaseClaimFlag, FSSAIViolation, Verdict
)

# Rule 1 Dictionary
SWEETENER_DB = {
    "maltodextrin":        {"gi": 110, "label": "Ultra High GI – Spikes Higher Than Glucose", "risk": "HIGH"},
    "liquid glucose":      {"gi": 100, "label": "High GI – Equivalent to Pure Glucose",       "risk": "HIGH"},
    "glucose syrup":       {"gi": 100, "label": "High GI – Equivalent to Pure Glucose",       "risk": "HIGH"},
    "jaggery":             {"gi": 84,  "label": "High GI – Refined Alternative",              "risk": "HIGH"},
    "gur":                 {"gi": 84,  "label": "High GI – Refined Alternative",              "risk": "HIGH"},
    "honey":               {"gi": 65,  "label": "Moderate-High GI",                           "risk": "MODERATE"},
    "date paste":          {"gi": 65,  "label": "Moderate-High GI – High Fructose/Glucose",   "risk": "MODERATE"},
    "date syrup":          {"gi": 65,  "label": "Moderate-High GI – High Fructose/Glucose",   "risk": "MODERATE"},
    "maltitol":            {"gi": 43,  "label": "Moderate GI Polyol – Laxative Warning",      "risk": "MODERATE"},
    "erythritol":          {"gi": 0,   "label": "Zero GI Sugar Alcohol",                      "risk": "NONE"},
    "stevia":              {"gi": 0,   "label": "Zero GI Natural Sweetener",                  "risk": "NONE"},
    "steviol glycosides":  {"gi": 0,   "label": "Zero GI Natural Sweetener",                  "risk": "NONE"},
    "sucralose":           {"gi": 0,   "label": "Zero GI Artificial Sweetener",               "risk": "NONE"},
}

# Rule 2 Tiers
PROTEIN_TIERS = {
    "TIER_1": {
        "sources": ["whey protein isolate", "whey isolate", "whey protein concentrate", "whey concentrate", "milk protein isolate", 
                    "milk protein concentrate", "micellar casein", "egg albumin"],
        "label": "Tier 1 – High Bioavailability (DIAAS > 1.0)",
    },
    "TIER_1_5": {
        "sources": ["yeast protein isolate"],
        "label": "Tier 1.5 – Novel / Fermentation-Derived",
    },
    "TIER_2": {
        "sources": ["soy protein isolate", "pea protein isolate"],
        "label": "Tier 2 – Plant Blend (Moderate Bioavailability)",
    },
    "TIER_3": {
        "sources": ["roasted peanuts", "peanuts", "wheat gluten", "maida", "wheat flour", "wheat flour (maida)",
                    "soy flour", "soy flakes"],
        "label": "Tier 3 – Filler / Low Bioavailability",
    }
}

# Rule 4 Patterns
DISEASE_CLAIM_PATTERNS = [
    (r"\b(reverse[sd]?|cures?|prevents?|remission of)\b.{0,30}\bdiabet", "FSSAI Advertising Regs 2018 §4"),
    (r"\b(lower[sd]?|reduce[sd]?|controls?|cures?)\b.{0,30}\b(blood pressure|hypertension)", "FSSAI Advertising Regs 2018 §4"),
    (r"\b(prevents?|fights?|anti-?cancer|cures?)\b.{0,30}\bcancer", "FSSAI Advertising Regs 2018 §4"),
    (r"\b(prevent[sd]?|reverse[sd]?|cures?)\b.{0,30}\b(heart disease|cardiovascular)", "FSSAI Advertising Regs 2018 §4"),
    (r"\b(therapeutic|medicinal|clinically proven to cure|treat[sd]?)\b", "FSSAI FSS Act 2006 §24"),
]

def audit_sweeteners(data: ExtractionData) -> Tuple[SweetenerAudit, List[FSSAIViolation]]:
    found_flags = []
    max_gi = -1
    overall_risk = "NONE"
    
    ingredients = [i.lower().strip() for i in data.ingredients_raw]
    
    for ing in ingredients:
        for sw_key, sw_data in SWEETENER_DB.items():
            if sw_key in ing:
                is_hidden = sw_data["gi"] > 0
                flag = SweetenerFlag(
                    name=ing,
                    gi_value=sw_data["gi"],
                    classification=sw_data["label"],
                    is_hidden_sugar=is_hidden
                )
                found_flags.append(flag)
                if sw_data["gi"] > max_gi:
                    max_gi = sw_data["gi"]
                    overall_risk = sw_data["risk"]
                    
    # FSSAI Misalignment
    fssai_violations = []
    fssai_misalignment = False
    
    front_claims_lower = [c.lower() for c in data.front_claims]
    claims_no_sugar = any("no added sugar" in c or "zero refined sugar" in c for c in front_claims_lower)
    has_hidden_sugar = any(f.is_hidden_sugar for f in found_flags)
    
    if claims_no_sugar and has_hidden_sugar:
        fssai_misalignment = True
        fssai_violations.append(
            FSSAIViolation(
                rule_reference="FSSAI Schedule II Advertising Misalignment",
                description="Front claims 'No Added Sugar' but hidden sugars/syrups with GI > 0 detected in ingredients."
            )
        )
        
    return SweetenerAudit(
        sweeteners_found=found_flags,
        overall_glycemic_risk=overall_risk,
        fssai_misalignment_flagged=fssai_misalignment
    ), fssai_violations

def audit_protein(data: ExtractionData) -> ProteinAudit:
    ingredients = [i.lower().strip() for i in data.ingredients_raw]
    
    # Identify Tier
    top_tier = "None detected"
    true_source = None
    first_tier1_idx = -1
    
    for idx, ing in enumerate(ingredients):
        # Check tier 1
        for t1 in PROTEIN_TIERS["TIER_1"]["sources"]:
            if t1 in ing:
                if top_tier == "None detected" or "Tier 3" in top_tier or "Tier 2" in top_tier:
                    top_tier = PROTEIN_TIERS["TIER_1"]["label"]
                    true_source = ing
                if first_tier1_idx == -1:
                    first_tier1_idx = idx
                break
        
        # Check tier 1.5
        for t15 in PROTEIN_TIERS["TIER_1_5"]["sources"]:
            if t15 in ing:
                 if top_tier == "None detected" or "Tier 3" in top_tier or "Tier 2" in top_tier:
                    top_tier = PROTEIN_TIERS["TIER_1_5"]["label"]
                    true_source = ing
                 break
                 
        # Check tier 2
        for t2 in PROTEIN_TIERS["TIER_2"]["sources"]:
            if t2 in ing:
                 if top_tier == "None detected" or "Tier 3" in top_tier:
                    top_tier = PROTEIN_TIERS["TIER_2"]["label"]
                    true_source = ing
                 break
                 
        # Check tier 3
        for t3 in PROTEIN_TIERS["TIER_3"]["sources"]:
             if t3 in ing:
                  if top_tier == "None detected":
                      top_tier = PROTEIN_TIERS["TIER_3"]["label"]
                      true_source = ing
                  break

    # Sprinkle Trick
    front_claims_lower = [c.lower() for c in data.front_claims]
    claims_whey = any("whey" in c for c in front_claims_lower)
    sprinkle_trick = False
    
    if claims_whey and first_tier1_idx > 2:
        sprinkle_trick = True
        
    return ProteinAudit(
        declared_g=data.macros_per_serving.protein_g or 0.0,
        source_tier=top_tier,
        true_source=true_source,
        sprinkle_trick_detected=sprinkle_trick
    )

def audit_pcal(data: ExtractionData) -> PCaloRatio:
    macros = data.macros_per_serving
    protein_cals = (macros.protein_g or 0.0) * 4
    energy = macros.energy_kcal or 0.0
    
    if energy > 0:
        eff_pct = (protein_cals / energy) * 100
    else:
        eff_pct = 0.0
        
    if eff_pct >= 40:
        cls = "Elite – High Efficiency Lean Protein"
    elif eff_pct >= 25:
        cls = "Moderate Protein Snack"
    else:
        cls = "Caloric Snack with Protein Padding"
        
    return PCaloRatio(
        protein_calories=round(protein_cals, 1),
        efficiency_pct=round(eff_pct, 1),
        classification=cls
    )

def audit_disease_claims(data: ExtractionData) -> List[DiseaseClaimFlag]:
    flags = []
    texts_to_check = data.front_claims + data.disease_or_medicinal_claims
    texts_to_check = [t.lower() for t in texts_to_check]
    
    for text in texts_to_check:
        for pattern, reg in DISEASE_CLAIM_PATTERNS:
            if re.search(pattern, text):
                flags.append(DiseaseClaimFlag(
                    claim_text=text,
                    regulation_violated=reg
                ))
    return flags

def generate_verdict(
    sw_audit: SweetenerAudit, 
    pr_audit: ProteinAudit, 
    pc_audit: PCaloRatio, 
    disease_flags: List[DiseaseClaimFlag],
    fssai_violations: List[FSSAIViolation]
) -> Verdict:
    
    works_if = []
    wont_work_if = []
    
    # Overall label logic
    if disease_flags:
        overall_label = "Unlawful Therapeutic Claim Detected"
    elif sw_audit.overall_glycemic_risk == "HIGH" and pr_audit.sprinkle_trick_detected:
        overall_label = "High-Sugar Snack with Protein Sprinkle"
    elif pc_audit.efficiency_pct >= 40 and sw_audit.overall_glycemic_risk in ["LOW", "NONE"]:
        overall_label = "Clean Label Workout Fuel"
    elif "Polyol" in sw_audit.sweeteners_found or any(f.gi_value == 43 for f in sw_audit.sweeteners_found):
         overall_label = "Polyol-Sweetened Functional Snack"
    elif sw_audit.overall_glycemic_risk == "HIGH":
         overall_label = "High Glycemic Energy Snack"
    else:
         overall_label = "Standard Processed Snack"

    # Won't work if
    if disease_flags:
        wont_work_if.append("You believe this product can cure or treat a medical condition (Illegal claim).")
    if fssai_violations:
        wont_work_if.append("You rely solely on front-of-pack claims, which contradict the ingredient list.")
    if pr_audit.sprinkle_trick_detected:
        wont_work_if.append("You are looking for a primary whey protein source (whey is a minor ingredient here).")
    if sw_audit.overall_glycemic_risk == "HIGH":
        wont_work_if.append("Your goal is strict fat loss in a calorie deficit.")
        wont_work_if.append("You have diabetic insulin sensitivity to high GI sugars/syrups.")
    if any("maltitol" in f.name.lower() for f in sw_audit.sweeteners_found):
         wont_work_if.append("You have a sensitive gut (Maltitol can cause laxative effects).")
         
    # Works if
    if pc_audit.efficiency_pct >= 40:
        works_if.append("You want an elite lean protein source with minimal excess calories.")
    elif pc_audit.efficiency_pct >= 25:
         works_if.append("You want a moderate protein boost alongside your snack.")
    else:
         works_if.append("You need dense pre-workout calories and energy.")
         
    if sw_audit.overall_glycemic_risk in ["LOW", "NONE"]:
         works_if.append("You want an upgraded sweet craving with less glycemic impact.")
         
    if len(works_if) == 0:
        works_if.append("You are consuming this strictly for taste, fitting it into your daily caloric maintenance.")

    return Verdict(
        overall_label=overall_label,
        works_if=works_if,
        wont_work_if=wont_work_if
    )

def run_audits(data: ExtractionData) -> AuditResult:
    sw_audit, fssai_viols = audit_sweeteners(data)
    pr_audit = audit_protein(data)
    pc_audit = audit_pcal(data)
    disease_flags = audit_disease_claims(data)
    
    verdict = generate_verdict(sw_audit, pr_audit, pc_audit, disease_flags, fssai_viols)
    
    return AuditResult(
        product_name=data.product_name,
        serving_size_str=f"{data.serving_size.value}{data.serving_size.unit}",
        sweetener_audit=sw_audit,
        protein_audit=pr_audit,
        pcal_ratio=pc_audit,
        disease_claim_flags=disease_flags,
        fssai_violations=fssai_viols,
        verdict=verdict
    )
