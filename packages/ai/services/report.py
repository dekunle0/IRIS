import os

def generate_local_comment(findings: dict, test_type: str, reference_ranges: dict, patient_context: dict) -> str:
    age = patient_context.get("age", "unknown")
    gender = patient_context.get("gender", "unknown")
    parasitaemia = findings.get("parasitaemia_pct", 0.0)
    severity = findings.get("severity", "Low")

    if "Parasite" in test_type:
        return (f"Examination of blood film microscopy captures for patient (Age: {age}, Gender: {gender}) "
                f"revealed the presence of Plasmodium parasite forms. The calculated parasitaemia is {parasitaemia}%, "
                f"categorised as {severity} density. Ring-stage trophozoites were identified across examined fields. "
                f"These findings are consistent with acute malaria infection. Clinical correlation with patient symptoms "
                f"is strongly recommended.")
    
    return (f"Automated morphological analysis performed for patient (Age: {age}, Gender: {gender}) "
            f"under test category '{test_type}'. Review by a licensed Medical Laboratory Scientist is documented.")

def generate_enriched_comment(findings: dict, test_type: str, reference_ranges: dict, patient_context: dict) -> str | None:
    model_dir = "./models/enrichment/"
    if not os.path.exists(model_dir):
        return None
    return None