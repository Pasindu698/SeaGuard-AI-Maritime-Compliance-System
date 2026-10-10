
from typing import Any, Dict, List


class AnswerSafetyService:

    BLOCKED_MESSAGE = (
        "SeaGuard AI could not verify this answer "
        "against the available source evidence. "
        "The generated answer has been withheld. "
        "Please review the original documents "
        "and consult a qualified maritime officer."
    )

    UNAVAILABLE_MESSAGE = (
        "SeaGuard AI could not complete evidence "
        "verification. The generated answer has "
        "been withheld as a safety precaution. "
        "Please review the original documents "
        "and consult a qualified maritime officer."
    )

    PARTIAL_WARNING = (
        "Safety notice: Some generated claims were "
        "not supported by the source evidence and "
        "have been removed. Only claims classified "
        "as supported are shown below."
    )

    @staticmethod
    def build_supported_answer(
        claims: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
    ) -> str:

        valid_ids = {
            source.get("citation_id")
            for source in sources
        }

        supported_parts = []

        for claim in claims:
            if claim.get("status") != "supported":
                continue

            text = claim.get("claim", "").strip()

            if not text:
                continue

            citation_ids = [
                citation_id
                for citation_id in claim.get(
                    "citation_ids", []
                )
                if citation_id in valid_ids
            ]

            # Do not display factual claims
            # without valid supporting citations.
            if not citation_ids:
                continue

            citations = " ".join(
                f"[{citation_id}]"
                for citation_id in citation_ids
            )

            supported_parts.append(
                f"- {text} {citations}"
            )

        return "\n".join(supported_parts)

    def apply(
        self,
        verification: Dict[str, Any],
    ) -> Dict[str, Any]:

        status = verification.get(
            "verification_status",
            "unverified",
        )

        claims = verification.get(
            "verified_claims", []
        )

        sources = verification.get(
            "sources", []
        )

        result = dict(verification)

        if status == "supported":
            # Keep original answer only when
            # there are verified supported claims.
            if (
                claims
                and all(
                    claim.get("status") == "supported"
                    for claim in claims
                )
                and all(
                    claim.get("citation_ids")
                    for claim in claims
                )
            ):
                result["answer_blocked"] = False
                return result

        if status == "partially_supported":

            safe_answer = self.build_supported_answer(
                claims,
                sources,
            )

            if safe_answer:
                result["answer"] = (
                    self.PARTIAL_WARNING
                    + "\n\n"
                    + safe_answer
                )
                result["answer_blocked"] = True
                return result

        if status == "unverified":
            result["answer"] = self.UNAVAILABLE_MESSAGE
        else:
            result["answer"] = self.BLOCKED_MESSAGE

        result["answer_blocked"] = True
        return result


answer_safety_service = AnswerSafetyService()
