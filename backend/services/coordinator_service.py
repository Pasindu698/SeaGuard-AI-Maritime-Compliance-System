import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.database.mongodb import db
from backend.agents.compliance_retrieval_agent import compliance_retrieval_agent
from backend.agents.document_query_agent import document_query_agent


class CoordinatorService:
    """Coordinate document analysis, compliance retrieval and incident decisions."""

    HIGH_RISK_TERMS = {
        "fire", "flames", "explosion", "collision", "collided", "sinking",
        "capsize", "man overboard", "person overboard", "fell overboard",
        "water ingress", "flooding", "distress", "abandon ship", "piracy",
        "armed attack", "serious injury", "fatality",
    }
    MEDIUM_RISK_TERMS = {
        "smoke", "engine failure", "equipment failure", "security breach",
        "unauthorized access", "unauthorized person", "suspicious activity",
        "dangerous goods", "hazardous cargo", "navigation failure",
        "communication failure", "minor injury",
    }
    NEGATED_PHRASES = [
        "no fire", "no flames", "no explosion", "no collision", "no injury",
        "no injuries", "no serious injury", "no fatality", "no flooding",
        "no water ingress", "no security breach", "no unauthorized access",
        "no unauthorized person", "no suspicious activity", "no immediate danger",
        "no person overboard", "no man overboard", "no one overboard",
        "no dangerous goods incident", "no hazardous cargo incident",
    ]

    @staticmethod
    def _has_phrase(text: str, phrase: str) -> bool:
        return bool(re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text))

    def coordinate_incident(
        self,
        incident_description: str,
        limit: int = 5,
        document_id: Optional[str] = None,
        current_user=None,
    ) -> Dict[str, Any]:
        incident_description = incident_description.strip()
        if not incident_description:
            return self._empty_response()

        limit = max(1, min(int(limit), 10))
        document_result = None
        assessment_text = incident_description

        if document_id is not None:
            if current_user is None:
                raise ValueError("Authenticated user is required for document access.")
            saved_document = document_query_agent.get_document(document_id, current_user)
            document_result = {
                "document_id": saved_document["document_id"],
                "filename": saved_document.get("filename") or "Unknown document",
                "document_type": saved_document.get("document_type"),
                "summary": saved_document.get("summary") or "",
                "incident_type": saved_document.get("incident_type") or "general",
                "vessel_name": saved_document.get("vessel_name"),
            }
            # Use bounded source text; the uploaded report is untrusted evidence.
            document_text = (saved_document.get("extracted_text") or "")[:12000]
            if document_text:
                assessment_text = (
                    incident_description + "\n\nUploaded incident report:\n" + document_text
                )
            elif document_result["summary"]:
                assessment_text = (
                    incident_description + "\n\nUploaded report summary:\n"
                    + document_result["summary"]
                )

        classification_text = self._remove_negated_conditions(assessment_text)
        compliance_result = compliance_retrieval_agent.assess_incident(
            incident_description=assessment_text, limit=limit
        )
        incident_type = self._detect_incident_type(
            assessment_text, classification_text, compliance_result
        )
        risk_level = self._classify_risk(classification_text, incident_type)
        escalation_required = risk_level == "HIGH"
        escalation_message = self._build_escalation_message(risk_level, incident_type)
        recommended_actions = self._build_recommended_actions(
            compliance_result, risk_level, incident_type
        )
        references = self._build_references(compliance_result)
        compliance_status = compliance_result.get("status", "UNKNOWN")
        matched = compliance_result.get("matched_requirements") or []
        missing = compliance_result.get("missing_requirements") or []
        unverified = compliance_result.get("unverified_requirements") or []
        final_response = self._build_final_response(
            incident_type, risk_level, escalation_required,
            compliance_status, recommended_actions
        )
        if document_result is not None:
            final_response += (
                "\n\nDOCUMENT CONTEXT\n"
                f"Source: {document_result['filename']}\n"
                f"Vessel: {document_result.get('vessel_name') or 'Not identified'}\n"
                f"Extracted summary: {document_result['summary'] or 'Not available'}"
            )

        result = {
            "coordination_id": None,
            "incident_type": incident_type,
            "risk_level": risk_level,
            "escalation_required": escalation_required,
            "escalation_message": escalation_message,
            "recommended_actions": recommended_actions,
            "compliance_status": compliance_status,
            "matched_requirements": matched,
            "missing_requirements": missing,
            "unverified_requirements": unverified,
            "references": references,
            "document": document_result,
            "final_response": final_response,
            "disclaimer": (
                "SeaGuard AI is a prototype decision-support system. Its output "
                "does not replace the vessel's approved emergency procedures, "
                "the master's authority, or applicable maritime regulations."
            ),
        }
        result["coordination_id"] = self._save_coordination(
            incident_description, result,
            owner_id=(document_query_agent.get_user_id(current_user)
                      if current_user is not None else None),
        )
        return result

    def _remove_negated_conditions(self, text: str) -> str:
        cleaned = text.lower()
        cleaned = re.sub(
            r"\bno\s+[^.]*?\b(?:was|were|is|are)\s+"
            r"(?:identified|detected|reported|observed|found)\b[^.]*\.?",
            " ", cleaned, flags=re.IGNORECASE,
        )
        for phrase in sorted(self.NEGATED_PHRASES, key=len, reverse=True):
            cleaned = re.sub(
                r"(?<!\w)" + re.escape(phrase) + r"(?!\w)",
                " ", cleaned, flags=re.IGNORECASE,
            )
        return re.sub(r"\s+", " ", cleaned).strip()

    def _contains_explicit_negation(self, text: str) -> bool:
        lowered = text.lower()
        if any(self._has_phrase(lowered, p) for p in self.NEGATED_PHRASES):
            return True
        return bool(re.search(
            r"\bno\s+[^.]*?\b(?:was|were|is|are)\s+"
            r"(?:identified|detected|reported|observed|found)\b", lowered,
        ))

    def _detect_incident_type(
        self, incident_description: str, classification_text: str,
        compliance_result: Dict[str, Any]
    ) -> str:
        text = classification_text.lower()
        incident_terms = [
            ("fire", ("fire", "flame", "flames", "smoke")),
            ("collision", ("collision", "collided", "ship impact", "vessel impact")),
            ("person_overboard", (
                "person overboard", "man overboard", "fell overboard",
                "fallen overboard", "fell into the sea", "fallen into the sea",
            )),
            ("security", (
                "security breach", "unauthorized access", "unauthorized person",
                "suspicious activity", "piracy", "armed attack",
            )),
            ("dangerous_goods", ("dangerous goods", "hazardous cargo")),
        ]
        for incident, phrases in incident_terms:
            if any(self._has_phrase(text, p) for p in phrases):
                return incident
        if not self._contains_explicit_negation(incident_description):
            for reference in compliance_result.get("references") or []:
                detected = reference.get("detected_incident")
                if detected:
                    return detected
        return "unknown"

    def _classify_risk(self, classification_text: str, incident_type: str) -> str:
        text = classification_text.lower()
        if any(self._has_phrase(text, term) for term in self.HIGH_RISK_TERMS):
            return "HIGH"
        if incident_type in {"fire", "collision", "person_overboard"}:
            return "HIGH"
        if any(self._has_phrase(text, term) for term in self.MEDIUM_RISK_TERMS):
            return "MEDIUM"
        if incident_type in {"security", "dangerous_goods"}:
            return "MEDIUM"
        return "LOW"  # Prototype classification, not evidence of safety.

    def _build_escalation_message(self, risk_level: str, incident_type: str) -> str:
        if risk_level == "HIGH":
            return (
                "Immediate escalation is recommended. Notify the bridge, master, "
                "and responsible officers and follow the vessel's approved emergency procedures."
            )
        if risk_level == "MEDIUM":
            return (
                "Prompt officer review is recommended. Monitor the situation "
                "and follow applicable shipboard procedures."
            )
        return (
            "No automatic high-risk escalation flag was generated. "
            "Continue monitoring and seek officer review if conditions change."
        )

    def _build_recommended_actions(
        self, compliance_result: Dict[str, Any], risk_level: str,
        incident_type: str
    ) -> List[str]:
        if risk_level == "LOW" and incident_type == "unknown":
            return [
                "Record the safety observation and continue routine monitoring.",
                "Report changes or uncertainty to the responsible officer.",
            ]
        missing = compliance_result.get("missing_requirements") or []
        unverified = compliance_result.get("unverified_requirements") or []
        actions: List[str] = []
        seen = set()

        def add_action(action: str) -> None:
            action = str(action).strip()
            key = action.casefold()
            if action and key not in seen:
                seen.add(key)
                actions.append(action)

        for requirement in missing:
            requirement = str(requirement).strip().rstrip(".")
            if requirement:
                add_action(
                    "Report the explicitly uncompleted requirement to the "
                    f"responsible officer and follow approved procedures: {requirement}."
                )
        for requirement in unverified:
            requirement = str(requirement).strip().rstrip(".")
            if requirement:
                add_action(f"Confirm whether this action has been completed: {requirement}.")
        if not actions:
            add_action(
                "Notify the responsible officer and review the vessel's "
                "approved incident procedures."
            )
        return actions[:6]

    def _build_references(
        self,
        compliance_result: Dict[str, Any],
    ) -> List[Dict[str, Any]]:

        references = []

        for reference in compliance_result.get("references") or []:
            references.append({
                "filename": reference.get("filename", "unknown"),
                "source": reference.get("source", ""),
                "file_type": reference.get("file_type", ""),
                "detected_incident": reference.get("detected_incident"),
                "hybrid_score": float(
                    reference.get("hybrid_score", 0) or 0
                ),
                "summary": reference.get("summary", ""),
                "summary_type": reference.get(
                    "summary_type", "extractive"
                ),
                "evidence": reference.get("evidence", ""),
            })

        return references

    def _build_final_response(
        self, incident_type: str, risk_level: str,
        escalation_required: bool, compliance_status: str,
        recommended_actions: List[str]
    ) -> str:
        incident_label = (
            incident_type.replace("_", " ").title()
            if incident_type != "unknown" else "Unclassified Maritime Incident"
        )
        if escalation_required:
            escalation_text = (
                "Immediate human escalation is recommended. Inform the bridge, "
                "master, and responsible officers according to approved vessel procedures."
            )
        elif risk_level == "MEDIUM":
            escalation_text = (
                "Prompt responsible-officer review is recommended, with "
                "continued monitoring of the situation."
            )
        else:
            escalation_text = (
                "No automatic high-risk escalation flag was generated. "
                "Continue monitoring and request officer review if conditions change."
            )
        if recommended_actions:
            action_text = "\n".join(
                f"{index}. {action}"
                for index, action in enumerate(recommended_actions[:3], start=1)
            )
        else:
            action_text = "No specific actions generated; consult approved vessel procedures."
        return (
            "INCIDENT ASSESSMENT\n"
            f"Incident Type: {incident_label}\n"
            f"Risk Level: {risk_level}\n"
            f"Preliminary Compliance Status: {compliance_status}\n\n"
            "ESCALATION ASSESSMENT\n"
            f"{escalation_text}\n\n"
            "PRIORITY RECOMMENDATIONS\n"
            f"{action_text}\n\n"
            "IMPORTANT NOTICE\n"
            "This is a preliminary AI-assisted assessment, not a verified "
            "compliance determination. Unverified requirements must be reviewed "
            "by responsible personnel."
        )

    def _save_coordination(
        self, incident_description: str, result: Dict[str, Any],
        owner_id: Optional[str] = None
    ) -> Optional[str]:
        if db is None:
            print("MongoDB is not configured. Coordinator result was not saved.")
            return None
        try:
            record = {
                "agent": "Coordinator Agent",
                "incident_description": incident_description,
                "incident_type": result["incident_type"],
                "risk_level": result["risk_level"],
                "escalation_required": result["escalation_required"],
                "escalation_message": result["escalation_message"],
                "recommended_actions": result["recommended_actions"],
                "compliance_status": result["compliance_status"],
                "matched_requirements": result["matched_requirements"],
                "missing_requirements": result["missing_requirements"],
                "unverified_requirements": result.get("unverified_requirements", []),
                "references": result["references"],
                "document": result.get("document"),
                "final_response": result["final_response"],
                "created_at": datetime.now(timezone.utc),
            }
            if owner_id is not None:
                record["owner_id"] = owner_id
            inserted = db["coordinator_assessments"].insert_one(record)
            return str(inserted.inserted_id)
        except Exception as error:
            print("Coordinator MongoDB save error:", error)
            return None

    def _empty_response(self) -> Dict[str, Any]:
        return {
            "coordination_id": None,
            "incident_type": "unknown",
            "risk_level": "LOW",
            "escalation_required": False,
            "escalation_message": "Insufficient information for escalation assessment.",
            "recommended_actions": [],
            "compliance_status": "INSUFFICIENT_INFORMATION",
            "matched_requirements": [],
            "missing_requirements": [],
            "unverified_requirements": [],
            "references": [],
            "document": None,
            "final_response": "Insufficient incident information was provided.",
            "disclaimer": "SeaGuard AI is a prototype decision-support system.",
        }


coordinator_service = CoordinatorService()
