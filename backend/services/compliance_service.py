import re
from datetime import datetime, timezone

from backend.database.mongodb import db
from backend.services.hybrid_retrieval_service import (
    hybrid_retrieval_service
)


class ComplianceService:
    """
    Prototype preliminary maritime compliance assessment service.

    Uses hybrid retrieval:
    - Keyword / incident-aware retrieval
    - Semantic vector retrieval with ChromaDB
    - Hybrid re-ranking
    """

    def __init__(self):
        self.retrieval_service = hybrid_retrieval_service

    # -------------------------------------------------
    # REQUIREMENT EXTRACTION
    # -------------------------------------------------

    def _extract_requirements(
        self,
        content: str
    ):
        """
        Extract clean numbered operational requirements
        from retrieved emergency procedure text.
        """

        pattern = (
            r"(?:^|\n|\s)"
            r"(\d+)\.\s+"
            r"(.+?)"
            r"(?=(?:\s+\d+\.\s)|$)"
        )

        matches = re.findall(
            pattern,
            content,
            flags=re.DOTALL
        )

        requirements = []

        for _, requirement in matches:

            # Remove metadata accidentally attached
            # at chunk boundaries.
            for marker in [
                "RELATED KNOWLEDGE:",
                "KEYWORDS:",
                "SOURCE:",
                "REFERENCES:"
            ]:
                if marker in requirement:
                    requirement = requirement.split(
                        marker
                    )[0]

            # Normalize whitespace.
            requirement = " ".join(
                requirement.split()
            ).strip()

            # Ignore incomplete / useless text.
            if len(requirement) < 10:
                continue

            if requirement not in requirements:
                requirements.append(
                    requirement
                )

        return requirements

    # -------------------------------------------------
    # REQUIREMENT MATCHING
    # -------------------------------------------------

    def _requirement_matches(
        self,
        requirement: str,
        incident_description: str
    ):
        """
        Prototype action-aware keyword matching between
        an incident description and an operational
        requirement.

        Common maritime action wording variations are
        normalized before word-overlap matching.
        """

        stop_words = {
            "the",
            "and",
            "for",
            "with",
            "from",
            "that",
            "this",
            "into",
            "are",
            "was",
            "were",
            "has",
            "have",
            "had",
            "ship",
            "vessel",
            "incident",
            "emergency",
            "when",
            "where",
            "being",
            "been",
            "any",
            "relevant",
            "appropriate"
        }

        # ---------------------------------------------
        # TEXT NORMALIZATION
        # ---------------------------------------------

        def normalize_text(text: str) -> str:
            """
            Normalize common grammatical and maritime
            wording variations before comparison.
            """

            text = text.lower()

            replacements = {
                # Action variations
                "notified": "notify",
                "notifying": "notify",

                "checked": "check",
                "checking": "check",

                "recorded": "record",
                "recording": "record",

                "raised": "raise",
                "raising": "raise",

                "assessed": "assess",
                "assessing": "assess",

                "monitored": "monitor",
                "monitoring": "monitor",

                "identified": "identify",
                "identifying": "identify",

                "maintained": "maintain",
                "maintaining": "maintain",

                "communicated": "communicate",
                "communicating": "communicate",

                "prepared": "prepare",
                "preparing": "prepare",

                "deployed": "deploy",
                "deploying": "deploy",

                "recovered": "recover",
                "recovering": "recover",

                "followed": "follow",
                "following": "follow",

                "used": "use",
                "using": "use",

                # Maritime wording equivalents
                "flooding": "water ingress",

                "hull damage": "vessel damage",

                "damage to the hull":
                    "vessel damage",

                "incident details":
                    "incident information",

                "details of the incident":
                    "incident information"
            }

            # Replace longer phrases first.
            for old, new in sorted(
                replacements.items(),
                key=lambda item: len(item[0]),
                reverse=True
            ):
                text = text.replace(
                    old,
                    new
                )

            return text

        requirement_normalized = normalize_text(
            requirement
        )

        incident_normalized = normalize_text(
            incident_description
        )

        # ---------------------------------------------
        # WORD EXTRACTION
        # ---------------------------------------------

        requirement_words = set(
            re.findall(
                r"\b[a-zA-Z]{3,}\b",
                requirement_normalized
            )
        )

        incident_words = set(
            re.findall(
                r"\b[a-zA-Z]{3,}\b",
                incident_normalized
            )
        )

        requirement_words -= stop_words
        incident_words -= stop_words

        # ---------------------------------------------
        # WORD OVERLAP
        # ---------------------------------------------

        matched_words = (
            requirement_words.intersection(
                incident_words
            )
        )

        # At least two meaningful matching words
        # are required for this prototype.
        return len(matched_words) >= 2

    # -------------------------------------------------
    # MONGODB ASSESSMENT STORAGE
    # -------------------------------------------------

    def _save_assessment(
        self,
        incident_description: str,
        assessment: dict
    ):
        """
        Save compliance assessment history to MongoDB.

        MongoDB failure does not stop the main
        compliance assessment API.
        """

        if db is None:
            print(
                "MongoDB is not configured. "
                "Assessment was not saved."
            )
            return None

        try:
            detected_incident = None

            if assessment["references"]:
                detected_incident = (
                    assessment["references"][0].get(
                        "detected_incident"
                    )
                )

            record = {
                "assessment_type":
                    assessment["assessment_type"],

                "incident_description":
                    incident_description,

                "detected_incident":
                    detected_incident,

                "status":
                    assessment["status"],

                "matched_requirements":
                    assessment["matched_requirements"],

                "missing_requirements":
                    assessment["missing_requirements"],

                "references":
                    assessment["references"],

                "disclaimer":
                    assessment["disclaimer"],

                "created_at":
                    datetime.now(timezone.utc)
            }

            result = db[
                "compliance_assessments"
            ].insert_one(record)

            print(
                "Compliance assessment saved to MongoDB:",
                result.inserted_id
            )

            return str(
                result.inserted_id
            )

        except Exception as error:
            print(
                "MongoDB compliance assessment save error:",
                error
            )

            return None

    # -------------------------------------------------
    # COMPLIANCE ASSESSMENT
    # -------------------------------------------------

    def check_compliance(
        self,
        incident_description: str,
        limit: int = 5
    ):
        """
        Perform a prototype preliminary compliance
        assessment using hybrid retrieval.
        """

        # Hybrid retrieval:
        # keyword + semantic vector search + re-ranking.
        retrieval_results = (
            self.retrieval_service.search(
                query=incident_description,
                limit=limit
            )
        )

        requirements = []

        # ---------------------------------------------
        # EXTRACT OPERATIONAL REQUIREMENTS
        # ---------------------------------------------

        for result in retrieval_results:

            # Only prototype emergency procedure files
            # are used for extracting actionable
            # operational requirements.
            if (
                "emergency_procedures"
                not in result["source"]
            ):
                continue

            extracted = self._extract_requirements(
                result["content"]
            )

            for requirement in extracted:

                if requirement not in requirements:
                    requirements.append(
                        requirement
                    )

        # ---------------------------------------------
        # MATCH REQUIREMENTS
        # ---------------------------------------------

        matched_requirements = []
        missing_requirements = []

        for requirement in requirements:

            if self._requirement_matches(
                requirement,
                incident_description
            ):
                matched_requirements.append(
                    requirement
                )

            else:
                missing_requirements.append(
                    requirement
                )

        # ---------------------------------------------
        # DETERMINE ASSESSMENT STATUS
        # ---------------------------------------------

        if not requirements:

            status = (
                "INSUFFICIENT_INFORMATION"
            )

        elif not missing_requirements:

            status = (
                "PROVISIONALLY_ALIGNED"
            )

        elif matched_requirements:

            status = (
                "PARTIALLY_ALIGNED"
            )

        else:

            status = (
                "REVIEW_REQUIRED"
            )

        # ---------------------------------------------
        # BUILD SUPPORTING REFERENCES
        # ---------------------------------------------

        references = []

        for result in retrieval_results:

            reference = {
                "filename":
                    result["filename"],

                "source":
                    result["source"],

                "file_type":
                    result["file_type"],

                "keyword_score":
                    result["keyword_score"],

                "similarity_score":
                    result["similarity_score"],

                "hybrid_score":
                    result["hybrid_score"],

                "detected_incident":
                    result.get(
                        "detected_incident"
                    )
            }

            if reference not in references:
                references.append(
                    reference
                )

        # ---------------------------------------------
        # FINAL ASSESSMENT
        # ---------------------------------------------

        assessment = {
            "assessment_type":
                "prototype_preliminary_assessment",

            "status":
                status,

            "matched_requirements":
                matched_requirements,

            "missing_requirements":
                missing_requirements,

            "references":
                references,

            "disclaimer": (
                "This is a prototype preliminary "
                "assessment and not a legal "
                "determination of maritime compliance."
            )
        }

        # ---------------------------------------------
        # SAVE ASSESSMENT TO MONGODB
        # ---------------------------------------------

        self._save_assessment(
            incident_description=incident_description,
            assessment=assessment
        )

        return assessment


# -----------------------------------------------------
# SINGLETON SERVICE INSTANCE
# -----------------------------------------------------

compliance_service = ComplianceService()