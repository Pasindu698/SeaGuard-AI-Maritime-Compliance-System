from backend.services.compliance_service import compliance_service


incident_description = """
A fire started in the engine room.
The crew activated the fire alarm and used fire extinguishers.
The master was informed and crew members were moved to a safe area.
"""


result = compliance_service.check_compliance(
    incident_description=incident_description,
    limit=5
)


print("\n===== COMPLIANCE TEST =====")

print("\nAssessment Type:")
print(result["assessment_type"])

print("\nStatus:")
print(result["status"])

print("\nMatched Requirements:")
for requirement in result["matched_requirements"]:
    print(f"✓ {requirement}")

print("\nMissing Requirements:")
for requirement in result["missing_requirements"]:
    print(f"✗ {requirement}")

print("\nReferences:")
for reference in result["references"]:
    print(
        f"- {reference['filename']} "
        f"({reference['file_type']}) "
        f"Score: {reference['hybrid_score']}"
    )

print("\nDisclaimer:")
print(result["disclaimer"])