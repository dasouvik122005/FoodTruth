from models import ExtractionResult, ExtractionData, ServingSize, MacrosPerServing, ParentheticalSubIngredient

# Pre-loaded mock payloads for demo mode without API calls

YOGA_BAR_PAYLOAD = ExtractionResult(
    status="SUCCESS",
    rejection_reason=None,
    data=ExtractionData(
        product_name="Yoga Bar 10g Protein Bar",
        serving_size=ServingSize(value=50.0, unit="g"),
        front_claims=["10g Protein", "No Added Sugar", "100% Natural"],
        macros_per_serving=MacrosPerServing(
            energy_kcal=210.0,
            protein_g=10.0,
            total_carbs_g=25.0,
            total_sugars_g=8.0,
            added_sugars_g=0.0,
            polyols_g=0.0,
            total_fat_g=9.0,
            saturated_fat_g=2.5,
            dietary_fiber_g=4.0
        ),
        ingredients_raw=["dates", "almonds", "whey protein concentrate", "maltodextrin", "cocoa powder", "honey"],
        parenthetical_sub_ingredients=[],
        disease_or_medicinal_claims=[],
        has_nutrition_table=True,
        has_ingredient_list=True
    )
)

WHOLE_TRUTH_PAYLOAD = ExtractionResult(
    status="SUCCESS",
    rejection_reason=None,
    data=ExtractionData(
        product_name="The Whole Truth Double Cocoa Protein Bar",
        serving_size=ServingSize(value=52.0, unit="g"),
        front_claims=["15g Whey Protein", "Zero Added Sugar", "No Artificial Sweeteners"],
        macros_per_serving=MacrosPerServing(
            energy_kcal=223.0,
            protein_g=15.0,
            total_carbs_g=19.0,
            total_sugars_g=14.0,
            added_sugars_g=0.0,
            polyols_g=0.0,
            total_fat_g=10.4,
            saturated_fat_g=2.8,
            dietary_fiber_g=2.9
        ),
        ingredients_raw=["cashews", "dates", "whey protein isolate", "cocoa powder"],
        parenthetical_sub_ingredients=[],
        disease_or_medicinal_claims=[],
        has_nutrition_table=True,
        has_ingredient_list=True
    )
)

SUPERYOU_WAFER_PAYLOAD = ExtractionResult(
    status="SUCCESS",
    rejection_reason=None,
    data=ExtractionData(
        product_name="SuperYou Protein Wafer",
        serving_size=ServingSize(value=40.0, unit="g"),
        front_claims=["High Protein", "No Added Sugar", "Guilt Free Snack", "Whey Protein"],
        macros_per_serving=MacrosPerServing(
            energy_kcal=195.0,
            protein_g=10.0,
            total_carbs_g=18.0,
            total_sugars_g=2.0,
            added_sugars_g=0.0,
            polyols_g=12.0,
            total_fat_g=11.0,
            saturated_fat_g=6.0,
            dietary_fiber_g=1.5
        ),
        ingredients_raw=["wheat flour (maida)", "maltitol", "soy protein isolate", "edible vegetable oil", "whey protein concentrate", "cocoa solids", "erythritol"],
        parenthetical_sub_ingredients=[],
        disease_or_medicinal_claims=["Clinically proven to reverse diabetes"],
        has_nutrition_table=True,
        has_ingredient_list=True
    )
)

SAMPLES = {
    "Yoga Bar 10g Protein Bar": YOGA_BAR_PAYLOAD,
    "The Whole Truth Double Cocoa": WHOLE_TRUTH_PAYLOAD,
    "SuperYou Wafer": SUPERYOU_WAFER_PAYLOAD
}
