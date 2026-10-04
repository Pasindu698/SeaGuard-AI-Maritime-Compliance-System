import re
from datetime import datetime, timezone
from typing import Any, Dict, List

from backend.database.mongodb import db
from backend.agents.compliance_retrieval_agent import (
    compliance_retrieval_agent
)


class CoordinatorService:
    """
    Agent 4 - Coordinator Service.

    Responsibilities:
    - Coordinate Agent 3 compliance/retrieval output.
    - Identify incident type.
    - Handle simple explicit negations.
    - Classify LOW / MEDIUM / HIGH risk.
    - Determine human escalation requirements.
    - Generate recommended actions.
    - Build a final coordinated response.
    - Save coordination history to MongoDB.
    """

    HIGH_RISK_TERMS = {
        "fire",
        "flames",
        "explosion",
        "collision",
        "collided",
        "sinking",
        "capsize",
        "man overboard",
        "person overboard",
        "fell overboard",
        "water ingress",
        "flooding",
        "distress",
        "abandon ship",
        "piracy",
        "armed attack",
        "serious injury",
        "fatality",
    }

    MEDIUM_RISK_TERMS = {
        "smoke",
        "engine failure",
        "equipment failure",
        "security breach",
        "unauthorized access",
        "unauthorized person",
        "suspicious activity",
        "dangerous goods",
        "hazardous cargo",
        "navigation failure",
        "communication failure",
        "minor injury",
    }

    NEGATED_PHRASES = [
        "no fire",
        "no flames",
        "no explosion",
        "no collision",
        "no injury",
        "no injuries",
        "no serious injury",
        "no fatality",
        "no flooding",
        "no water ingress",
        "no security breach",
        "no unauthorized access",
        "no unauthorized person",
        "no suspicious activity",
        "no immediate danger",
        "no person overboard",
        "no man overboard",
        "no one overboard",
        "no dangerous goods incident",
        "no hazardous cargo incident",
    ]

    def coordinate_incident(
        self,
        incident_description: str,
        limit: int = 5,
    ) -> Dict[str, Any]:

        incident_description = incident_description.strip()

        if not incident_description:
            return self._empty_response()

        limit = max(1, min(limit, 10))

        # Clean the text only for Coordinator classification.
        classification_text = self._remove_negated_conditions(
            incident_description
        )

        # Agent 3 compliance/retrieval assessment.
        compliance_result = (
            compliance_retrieval_agent.assess_incident(
                incident_description=incident_description,
                limit=limit,
            )
        )

        incident_type = self._detect_incident_type(
            incident_description=incident_description,
            classification_text=classification_text,
            compliance_result=compliance_result,
        )

        risk_level = self._classify_risk(
            classification_text=classification_text,
            incident_type=incident_type,
        )

        escalation_required = risk_level == "HIGH"

        escalation_message = self._build_escalation_message(
            risk_level=risk_level,
            incident_type=incident_type,
        )

        recommended_actions = self._build_recommended_actions(
            compliance_result=compliance_result,
            risk_level=risk_level,
            incident_type=incident_type,
        )

        references = self._build_references(
            compliance_result
        )

        compliance_status = compliance_result.get(
            "status",
            "UNKNOWN",
        )

        final_response = self._build_final_response(
            incident_type=incident_type,
            risk_level=risk_level,
            escalation_required=escalation_required,
            compliance_status=compliance_status,
            recommended_actions=recommended_actions,
        )

        result = {
            "coordination_id": None,
            "incident_type": incident_type,
            "risk_level": risk_level,
            "escalation_required": escalation_required,
            "escalation_message": escalation_message,
            "recommended_actions": recommended_actions,
            "compliance_status": compliance_status,
            "matched_requirements": compliance_result.get(
                "matched_requirements",
                [],
            ),
            "missing_requirements": compliance_result.get(
                "missing_requirements",
                [],
            ),
            "references": references,
            "final_response": final_response,
            "disclaimer": (
                "SeaGuard AI is a prototype decision-support "
                "system. The response does not replace the "
                "vessel's approved emergency procedures, "
                "the master's authority, or applicable "
                "maritime regulations."
            ),
        }

        coordination_id = self._save_coordination(
            incident_description=incident_description,
            result=result,
        )

        result["coordination_id"] = coordination_id

        return result

    # =================================================
    # NEGATION HANDLING
    # =================================================

    def _remove_negated_conditions(
        self,
        text: str,
    ) -> str:
        """
        Remove simple explicitly negated emergency statements.

        Examples:
        - No fire was detected.
        - No fire, collision, injury, security breach,
          or immediate danger was identified.
        """

        cleaned_text = text.lower()

        # Handle a complete negated list.
        #
        # Example:
        # "No fire, collision, injury, security breach,
        # or immediate danger was identified."
        #
        # This removes the whole negative statement.
        cleaned_text = re.sub(
            r"\bno\s+[^.]*?\b"
            r"(?:was|were|is|are)\s+"
            r"(?:identified|detected|reported|observed|found)"
            r"\b[^.]*\.?",
            " ",
            cleaned_text,
            flags=re.IGNORECASE,
        )

        # Handle individual explicitly negated phrases.
        for phrase in self.NEGATED_PHRASES:
            cleaned_text = cleaned_text.replace(
                phrase,
                " ",
            )

        # Normalize spaces.
        cleaned_text = re.sub(
            r"\s+",
            " ",
            cleaned_text,
        ).strip()

        return cleaned_text

    # =================================================
    # INCIDENT DETECTION
    # =================================================

    def _detect_incident_type(
        self,
        incident_description: str,
        classification_text: str,
        compliance_result: Dict[str, Any],
    ) -> str:

        text = classification_text

        # Fire
        if (
            "fire" in text
            or "flame" in text
            or "flames" in text
        ):
            return "fire"

        if "smoke" in text:
            return "fire"

        # Collision
        if (
            "collision" in text
            or "collided" in text
            or "ship impact" in text
            or "vessel impact" in text
        ):
            return "collision"

        # Person overboard
        if (
            "person overboard" in text
            or "man overboard" in text
            or "fell overboard" in text
            or "fallen overboard" in text
            or "fell into the sea" in text
            or "fallen into the sea" in text
        ):
            return "person_overboard"

        # Security
        if (
            "security breach" in text
            or "unauthorized access" in text
            or "unauthorized person" in text
            or "suspicious activity" in text
            or "piracy" in text
            or "armed attack" in text
        ):
            return "security"

        # Dangerous goods
        if (
            "dangerous goods" in text
            or "hazardous cargo" in text
        ):
            return "dangerous_goods"

        # Use Agent 3 as a fallback only when the
        # original description does not contain
        # explicit negative incident statements.
        if not self._contains_explicit_negation(
            incident_description
        ):
            references = compliance_result.get(
                "references",
                [],
            )

            for reference in references:
                detected = reference.get(
                    "detected_incident"
                )

                if detected:
                    return detected

        return "unknown"

    def _contains_explicit_negation(
        self,
        text: str,
    ) -> bool:

        lowered_text = text.lower()

        # Individual negated phrases.
        if any(
            phrase in lowered_text
            for phrase in self.NEGATED_PHRASES
        ):
            return True

        # Negated list.
        negated_list_pattern = (
            r"\bno\s+[^.]*?\b"
            r"(?:was|were|is|are)\s+"
            r"(?:identified|detected|reported|observed|found)"
        )

        return bool(
            re.search(
                negated_list_pattern,
                lowered_text,
                flags=re.IGNORECASE,
            )
        )

    # =================================================
    # RISK CLASSIFICATION
    # =================================================

    def _classify_risk(
        self,
        classification_text: str,
        incident_type: str,
    ) -> str:

        text = classification_text.lower()

        if any(
            term in text
            for term in self.HIGH_RISK_TERMS
        ):
            return "HIGH"

        if incident_type in {
            "fire",
            "collision",
            "person_overboard",
        }:
            return "HIGH"

        if any(
            term in text
            for term in self.MEDIUM_RISK_TERMS
        ):
            return "MEDIUM"

        if incident_type in {
            "security",
            "dangerous_goods",
        }:
            return "MEDIUM"

        return "LOW"

    # =================================================
    # ESCALATION
    # =================================================

    def _build_escalation_message(
        self,
        risk_level: str,
        incident_type: str,
    ) -> str:

        if risk_level == "HIGH":
            return (
                "Immediate escalation is recommended. "
                "Notify the bridge, master, and responsible "
                "officers and follow the vessel's approved "
                "emergency procedures."
            )

        if risk_level == "MEDIUM":
            return (
                "Prompt officer review is recommended. "
                "Monitor the situation and follow applicable "
                "shipboard procedures."
            )

        return (
            "No automatic emergency escalation was "
            "identified. Continue monitoring and follow "
            "normal vessel procedures."
        )

    # =================================================
    # RECOMMENDED ACTIONS
    # =================================================

    def _build_recommended_actions(
        self,
        compliance_result: Dict[str, Any],
        risk_level: str,
        incident_type: str,
    ) -> List[str]:

        # Avoid returning emergency actions for a routine
        # LOW-risk observation if Agent 3 retrieved an
        # emergency document because of a negated keyword.
        if (
            risk_level == "LOW"
            and incident_type == "unknown"
        ):
            return [
                (
                    "Record the safety observation and "
                    "continue routine monitoring."
                ),
                (
                    "Report any change in conditions to "
                    "the responsible officer."
                ),
            ]

        missing = compliance_result.get(
            "missing_requirements",
            [],
        )

        if missing:
            return missing[:6]

        matched = compliance_result.get(
            "matched_requirements",
            [],
        )

        if matched:
            return matched[:6]

        return [
            (
                "Review the relevant shipboard procedure "
                "and notify the responsible officer."
            )
        ]

    # =================================================
    # REFERENCES
    # =================================================

    def _build_references(
        self,
        compliance_result: Dict[str, Any],
    ) -> List[Dict[str, Any]]:

        output = []

        for reference in compliance_result.get(
            "references",
            [],
        ):
            output.append(
                {
                    "filename": reference.get(
                        "filename",
                        "unknown",
                    ),
                    "source": reference.get(
                        "source",
                        "",
                    ),
                    "file_type": reference.get(
                        "file_type",
                        "",
                    ),
                    "detected_incident": reference.get(
                        "detected_incident"
                    ),
                    "hybrid_score": float(
                        reference.get(
                            "hybrid_score",
                            0,
                        )
                    ),
                }
            )

        return output

    # =================================================
    # FINAL RESPONSE
    # =================================================

    def _build_final_response(
        self,
        incident_type: str,
        risk_level: str,
        escalation_required: bool,
        compliance_status: str,
        recommended_actions: List[str],
    ) -> str:

        if incident_type == "unknown":
            incident_label = (
                "Routine / Unclassified Observation"
            )
        else:
            incident_label = (
                incident_type
                .replace("_", " ")
                .title()
            )

        if escalation_required:
            escalation_text = (
                "Immediate escalation is required."
            )
        else:
            escalation_text = (
                "Immediate high-risk escalation "
                "is not required."
            )

        action_text = ""

        if recommended_actions:
            action_text = (
                " Priority action: "
                + recommended_actions[0]
            )

        return (
            f"SeaGuard AI identified the incident as "
            f"{incident_label} with a {risk_level} risk "
            f"level. {escalation_text} "
            f"Preliminary compliance status: "
            f"{compliance_status}."
            f"{action_text}"
        )

    # =================================================
    # MONGODB
    # =================================================

    def _save_coordination(
        self,
        incident_description: str,
        result: Dict[str, Any],
    ):

        if db is None:
            print(
                "MongoDB is not configured. "
                "Coordinator result was not saved."
            )
            return None

        try:
            record = {
                "agent": "Coordinator Agent",
                "incident_description":
                    incident_description,
                "incident_type":
                    result["incident_type"],
                "risk_level":
                    result["risk_level"],
                "escalation_required":
                    result["escalation_required"],
                "escalation_message":
                    result["escalation_message"],
                "recommended_actions":
                    result["recommended_actions"],
                "compliance_status":
                    result["compliance_status"],
                "matched_requirements":
                    result["matched_requirements"],
                "missing_requirements":
                    result["missing_requirements"],
                "references":
                    result["references"],
                "final_response":
                    result["final_response"],
                "created_at":
                    datetime.now(timezone.utc),
            }

            insert_result = db[
                "coordinator_assessments"
            ].insert_one(record)

            print(
                "Coordinator assessment saved:",
                insert_result.inserted_id,
            )

            return str(
                insert_result.inserted_id
            )

        except Exception as error:
            print(
                "Coordinator MongoDB save error:",
                error,
            )
            return None

    # =================================================
    # EMPTY RESPONSE
    # =================================================

    def _empty_response(self):

        return {
            "coordination_id": None,
            "incident_type": "unknown",
            "risk_level": "LOW",
            "escalation_required": False,
            "escalation_message": (
                "Insufficient information for escalation."
            ),
            "recommended_actions": [],
            "compliance_status":
                "INSUFFICIENT_INFORMATION",
            "matched_requirements": [],
            "missing_requirements": [],
            "references": [],
            "final_response": (
                "Insufficient incident information "
                "was provided."
            ),
            "disclaimer": (
                "SeaGuard AI is a prototype "
                "decision-support system."
            ),
        }


coordinator_service = CoordinatorService()