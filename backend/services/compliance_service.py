import re

from sympy import content
from backend.services.retrieval_service import retrieval_service


class ComplianceService:

    def __init__(self):
        self.retrieval_service = retrieval_service

    def _extract_requirements(self, content: str):
        """
        Extract clean numbered operational requirements from retrieved
        emergency procedure text.
        """

        pattern = r"(?:^|\n|\s)(\d+)\.\s+(.+?)(?=(?:\s+\d+\.\s)|$)"

        matches = re.findall(
            pattern,
            content,
            flags=re.DOTALL
        )

        requirements = []

        for _, requirement in matches:

            # Remove metadata accidentally attached at chunk boundaries
            for marker in [
                "RELATED KNOWLEDGE:",
                "KEYWORDS:",
                "SOURCE:",
                "REFERENCES:"
            ]:
                if marker in requirement:
                    requirement = requirement.split(marker)[0]

            # Normalize whitespace
            requirement = " ".join(
                requirement.split()
            ).strip()

            # Ignore incomplete / useless extracted text
            if len(requirement) < 10:
                continue

            if requirement not in requirements:
                requirements.append(requirement)

        return requirements

    def _requirement_matches(
        self,
        requirement: str,
        incident_description: str
    ):
        """
        Prototype keyword-based matching between an incident
        description and an operational requirement.
        """

        stop_words = {
            "the", "and", "for", "with", "from",
            "that", "this", "into", "are", "was",
            "were", "has", "have", "had", "ship",
            "vessel", "incident", "emergency"
        }

        requirement_words = set(
            re.findall(
                r"\b[a-zA-Z]{3,}\b",
                requirement.lower()
            )
        )

        requirement_words -= stop_words

        incident_words = set(
            re.findall(
                r"\b[a-zA-Z]{3,}\b",
                incident_description.lower()
            )
        )

        matched_words = requirement_words.intersection(
            incident_words
        )

        return len(matched_words) >= 2

    def check_compliance(
        self,
        incident_description: str,
        limit: int = 5
    ):
        """
        Perform a preliminary prototype compliance assessment.
        """

        retrieval_results = self.retrieval_service.search(
            query=incident_description,
            limit=limit
        )

        requirements = []

        for result in retrieval_results:

            # Prototype operational procedures only.
            if "emergency_procedures" not in result["source"]:
                continue

            extracted = self._extract_requirements(
                result["content"]
            )

            for requirement in extracted:
                if requirement not in requirements:
                    requirements.append(requirement)

        matched_requirements = []
        missing_requirements = []

        for requirement in requirements:

            if self._requirement_matches(
                requirement,
                incident_description
            ):
                matched_requirements.append(requirement)
            else:
                missing_requirements.append(requirement)

        if not requirements:
            status = "INSUFFICIENT_INFORMATION"

        elif not missing_requirements:
            status = "PROVISIONALLY_ALIGNED"

        elif matched_requirements:
            status = "PARTIALLY_ALIGNED"

        else:
            status = "REVIEW_REQUIRED"

        references = []

        for result in retrieval_results:
            reference = {
                "filename": result["filename"],
                "source": result["source"],
                "file_type": result["file_type"],
                "score": result["score"]
            }

            if reference not in references:
                references.append(reference)

        return {
            "assessment_type": "prototype_preliminary_assessment",
            "status": status,
            "matched_requirements": matched_requirements,
            "missing_requirements": missing_requirements,
            "references": references,
            "disclaimer": (
                "This is a prototype preliminary assessment and "
                "not a legal determination of maritime compliance."
            )
        }


compliance_service = ComplianceService()