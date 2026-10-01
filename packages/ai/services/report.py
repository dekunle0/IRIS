import os

def generate_local_comment(findings: dict, test_type: str, reference_ranges: dict, patient_context: dict) -> str:
    age = patient_context.get("age")
    gender = patient_context.get("gender")
    
    # Generate demographic string conditionally to avoid "unknown" defaults (IRIS-H-097)
    demo_parts = []
    if age and age != 0:
        demo_parts.append(f"Age: {age}")
    if gender and gender != "unknown" and gender.strip() != "":
        demo_parts.append(f"Gender: {gender}")
    
    demo_str = ""
    if demo_parts:
        demo_str = f" for patient ({', '.join(demo_parts)})"

    parasitaemia = findings.get("parasitaemia_pct", 0.0)
    severity = findings.get("severity", "Low")

    if "Parasite" in test_type or "parasitology" in test_type.lower():
        if parasitaemia > 0:
            return (f"Examination of blood film microscopy captures{demo_str} "
                    f"revealed the presence of Plasmodium parasite forms. The calculated parasitaemia is {parasitaemia}%, "
                    f"categorised as {severity} density. "
                    f"These findings are consistent with acute malaria infection. Clinical correlation with patient symptoms "
                    f"is strongly recommended.")
        else:
            return (f"Examination of blood film microscopy captures{demo_str} "
                    f"did not reveal the presence of Plasmodium parasite forms in the examined fields of view. "
                    f"No significant parasitaemia detected (0.0%).")
    
    # Removed false review claim (IRIS-H-096)
    return (f"Automated morphological analysis performed{demo_str} "
            f"under test category '{test_type}'.")