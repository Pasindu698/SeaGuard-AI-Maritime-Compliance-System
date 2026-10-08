
"""SeaGuard AI: conservative, preliminary maritime procedure assessment.

Keyword heuristics are NOT a legal or safety compliance determination.
Human review is required.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional

from backend.database.mongodb import db
from backend.services.hybrid_retrieval_service import hybrid_retrieval_service

logger = logging.getLogger(__name__)


# -------------------------------------------------
# ACTION PATTERNS
# -------------------------------------------------

ACTIONS = {
    "alarm": r"\b(?:alarm|siren)\b",
    "notify": r"\b(?:notif\w*|inform(?:ed|ing|s)?|contact\w*)\b",
    "record": r"\b(?:record\w*|document(?:ed|ing|s)?|logg\w*|wrote|write|written)\b",
    "monitor": r"\b(?:monitor\w*|observ\w*|track\w*)\b",
    "identify": r"\b(?:identif\w*|locat\w*|discover\w*)\b",
    "isolate": r"\b(?:isolat\w*|contain\w*|seal\w*)\b",
    "equipment": r"\b(?:fire[ -]?fight\w*|extinguish\w*|suppress\w*)\b",
    "warn": r"\bwarn\w*\b",
    "follow": r"\b(?:follow\w*|comply\w*|adhere\w*)\b",
    "escape": r"\b(?:escap\w*|evacuat\w*)\b",
    "account": r"\b(?:account\w*|headcount|muster\w*|roll[ -]?call)\b",
    "recover": r"\b(?:recover\w*|rescu\w*)\b",
    "prepare": r"\b(?:prepar\w*|readied)\b",
    "assess": r"\b(?:assess\w*|evaluat\w*)\b",
    "check": r"\b(?:check\w*|inspect\w*|examin\w*)\b",
    "communicate": r"\bcommunicat\w*\b",
    "maintain": r"\bmaintain\w*\b",
    "determine": r"\bdetermin\w*\b",
}


# -------------------------------------------------
# EVIDENCE TARGETS
# -------------------------------------------------

TARGETS = {
    "water_ingress": r"\b(?:water\s+ingress|flood\w*|leak\w*|water\s+enter\w*)\b",
    "damage": r"\b(?:damag\w*|hull\s+breach\w*)\b",
    "alarm": r"\b(?:alarm|siren)\b",
    "bridge": r"\b(?:bridge|captain|master|responsible\s+officer\w*)\b",
    "fire": r"\b(?:fire|flames?|smoke)\b",
    "equipment": r"\b(?:fire[ -]?fight\w*|extinguish\w*|suppress\w*|equipment)\b",
    "record": r"\b(?:incident|collision|event|details?|information|actions?)\b",
    "stability": r"\b(?:stabilit\w*|list\w*|trim)\b",
    "crew": r"\b(?:crew|personnel|persons?|people|passengers?)\b",
}


NEGATION = re.compile(
    r"\b(?:not|never|without|no|failed\s+to|unable\s+to|"
    r"neglected\s+to|didn't|wasn't|weren't|couldn't)\b",
    re.I,
)

CLAUSE_SPLIT = re.compile(
    r"[.!?;]+|\b(?:but|however|although)\b|"
    r",?\s+\band\s+(?=(?:did|was|were|has|have|failed|never|not|could|unable)\b)",
    re.I,
)

REQUIREMENT_PATTERN = re.compile(
    r"(?:^|\s)(\d+)\.\s+(.+?)(?=\s+\d+\.\s+|$)",
    re.DOTALL,
)


# -------------------------------------------------
# TEXT PROCESSING
# -------------------------------------------------

def _clauses(text: str) -> List[str]:
    return [
        part.strip(" ,")
        for part in CLAUSE_SPLIT.split(text)
        if part.strip(" ,")
    ]


def _primary_action(requirement: str) -> Optional[str]:
    hits = [
        (match.start(), name)
        for name, pattern in ACTIONS.items()
        for match in list(re.finditer(pattern, requirement, re.I))[:1]
    ]

    return min(hits)[1] if hits else None


def _target(requirement: str, action: str) -> Optional[str]:
    text = requirement.lower()

    if re.search(TARGETS["water_ingress"], text, re.I):
        return "water_ingress"

    if action in {"assess", "check", "identify"}:
        if re.search(TARGETS["damage"], text, re.I):
            return "damage"

    if action == "alarm":
        return "alarm"

    if action == "notify":
        if re.search(TARGETS["bridge"], text, re.I):
            return "bridge"

    if action == "equipment":
        return "equipment"

    if action == "monitor":
        if re.search(TARGETS["stability"], text, re.I):
            return "stability"

    if action == "identify":
        if re.search(TARGETS["fire"], text, re.I):
            return "fire"

    return None


def _action_evidence(action: str, clause: str) -> bool:
    if action == "recover":
        # Recovery evidence needs separate handling.
        # Starting a rescue is not proof of recovery.
        return bool(
            re.search(ACTIONS["recover"], clause, re.I)
        )

    if re.search(ACTIONS[action], clause, re.I):
        return True

    if action == "alarm":
        if re.search(
            r"\b(?:rais\w*|sound\w*|activat\w*)\b",
            clause,
            re.I,
        ):
            return bool(
                re.search(TARGETS["alarm"], clause, re.I)
            )

    if action == "equipment":
        if re.search(
            r"\bus(?:e|ed|ing)\b",
            clause,
            re.I,
        ):
            return bool(
                re.search(TARGETS["equipment"], clause, re.I)
            )

    return False

def _classify_recovery(incident: str) -> str:
    """
    Classify recovery completion conservatively.

    Rescue preparation or operations in progress
    must not be treated as completed recovery.
    """

    positive = False
    negative = False

    completion_pattern = re.compile(
        r"\b(?:recovered|rescued)\b",
        re.I,
    )

    failure_pattern = re.compile(
        r"\b(?:"
        r"(?:did\s+not|didn't|failed\s+to|unable\s+to|"
        r"could\s+not|couldn't|never)\s+"
        r"(?:successfully\s+)?(?:recover|rescue)"
        r"|(?:recovery|rescue)\s+(?:failed|unsuccessful)"
        r")\b",
        re.I,
    )

    for clause in _clauses(incident):

        if failure_pattern.search(clause):
            negative = True
            continue

        if not completion_pattern.search(clause):
            continue

        # Avoid treating explicitly negated recovery
        # as a completed recovery.
        if NEGATION.search(clause):
            continue

        # The recovered/rescued person must be explicit.
        person_evidence = re.search(
            r"\b(?:person|man|woman|crew\s+member|"
            r"seafarer|victim|casualty|him|her|them)\b",
            clause,
            re.I,
        )

        if person_evidence:
            positive = True

    if positive and negative:
        return "not_mentioned"

    if negative:
        return "explicitly_not_done"

    if positive:
        return "matched"

    return "not_mentioned"

def _classify_combined_alarm_notification(
    requirement: str,
    incident: str,
) -> Optional[str]:
    """
    Require evidence of BOTH raising the alarm
    and notifying the bridge for combined requirements.
    """

    requirement_lower = requirement.lower()

    requires_alarm = bool(
        re.search(ACTIONS["alarm"], requirement_lower, re.I)
    )

    requires_bridge_notification = bool(
        re.search(
            r"\b(?:alert|notify|inform|contact)\w*\b",
            requirement_lower,
            re.I,
        )
        and re.search(TARGETS["bridge"], requirement_lower, re.I)
    )

    if not (requires_alarm and requires_bridge_notification):
        return None

    alarm_positive = False
    bridge_positive = False
    alarm_negative = False
    bridge_negative = False

    for clause in _clauses(incident):
        alarm_evidence = _action_evidence("alarm", clause)

        bridge_evidence = bool(
            re.search(
                r"\b(?:alert\w*|notif\w*|inform\w*|contact\w*)\b",
                clause,
                re.I,
            )
            and re.search(TARGETS["bridge"], clause, re.I)
        )

        negated = bool(NEGATION.search(clause))

        if alarm_evidence:
            if negated:
                alarm_negative = True
            else:
                alarm_positive = True

        if bridge_evidence:
            if negated:
                bridge_negative = True
            else:
                bridge_positive = True

    if alarm_negative or bridge_negative:
        return "not_mentioned"

    if alarm_positive and bridge_positive:
        return "matched"

    return "not_mentioned"


def _classify(requirement: str, incident: str) -> str:
    """Classify reported evidence conservatively."""

    combined_result = _classify_combined_alarm_notification(
        requirement,
        incident,
    )

    if combined_result is not None:
        return combined_result

    action = _primary_action(requirement)

    if not action:
        return "not_mentioned"

    if action == "recover":
        return _classify_recovery(incident)


    target = _target(requirement, action)

    positive = False
    negative = False

    for clause in _clauses(incident):
        if not _action_evidence(action, clause):
            continue

        if target and not re.search(
            TARGETS[target], clause, re.I
        ):
            continue

        # Multiple actions in one clause can make
        # negation scope ambiguous.
        # Do not mark an ambiguous action as completed.
        action_matches = sum(
            bool(re.search(pattern, clause, re.I))
            for pattern in ACTIONS.values()
        )

        if NEGATION.search(clause):
            if action_matches > 1:
                return "not_mentioned"

            negative = True
        else:
            positive = True

    if positive and negative:
        return "not_mentioned"

    if negative:
        return "explicitly_not_done"

    if positive:
        return "matched"

    return "not_mentioned"


# -------------------------------------------------
# COMPLIANCE SERVICE
# -------------------------------------------------

class ComplianceService:

    def __init__(self):
        self.retrieval_service = hybrid_retrieval_service

    def _extract_requirements(
        self,
        content: str,
    ) -> List[str]:

        requirements = []

        for _, value in REQUIREMENT_PATTERN.findall(content):

            for marker in (
                "RELATED KNOWLEDGE:",
                "KEYWORDS:",
                "SOURCE:",
                "REFERENCES:",
            ):
                value = value.split(marker)[0]

            value = " ".join(value.split()).strip()

            if (
                len(value) >= 10
                and value not in requirements
            ):
                requirements.append(value)

        return requirements

    # ---------------------------------------------
    # DATABASE PERSISTENCE
    # ---------------------------------------------

    def _save_assessment(
        self,
        incident_description: str,
        assessment: Dict,
    ) -> Optional[str]:

        if db is None:
            logger.warning(
                "MongoDB not configured; assessment not saved."
            )
            return None

        try:
            record = {
                **assessment,
                "incident_description": incident_description,
                "detected_incident": next(
                    (
                        ref.get("detected_incident")
                        for ref in assessment["references"]
                        if ref.get("detected_incident")
                    ),
                    None,
                ),
                "created_at": datetime.now(timezone.utc),
            }

            result = db[
                "compliance_assessments"
            ].insert_one(record)

            logger.info(
                "Compliance assessment saved: %s",
                result.inserted_id,
            )

            return str(result.inserted_id)

        except Exception:
            logger.exception(
                "Could not save compliance assessment."
            )
            return None

    # ---------------------------------------------
    # COMPLIANCE ASSESSMENT
    # ---------------------------------------------

    def check_compliance(
        self,
        incident_description: str,
        limit: int = 5,
    ) -> Dict:

        retrieval_results = self.retrieval_service.search(
            query=incident_description,
            limit=limit,
        )

        requirements = []

        for result in retrieval_results:

            source = (
                result.get("source", "")
                .replace("\\", "/")
            )

            if "emergency_procedures" not in source:
                continue

            extracted = self._extract_requirements(
                result.get("content", "")
            )

            for requirement in extracted:
                if requirement not in requirements:
                    requirements.append(requirement)

        matched = []
        missing = []
        unverified = []

        for requirement in requirements:

            classification = _classify(
                requirement,
                incident_description,
            )

            if classification == "matched":
                matched.append(requirement)

            elif classification == "explicitly_not_done":
                missing.append(requirement)

            else:
                unverified.append(requirement)

        # -----------------------------------------
        # ASSESSMENT STATUS
        # -----------------------------------------

        if not requirements:
            status = "INSUFFICIENT_INFORMATION"

        elif missing:
            status = "REVIEW_REQUIRED"

        elif unverified:
            status = (
                "PARTIALLY_ALIGNED"
                if matched
                else "REVIEW_REQUIRED"
            )

        else:
            status = "PROVISIONALLY_ALIGNED"

        # -----------------------------------------
        # SOURCE REFERENCES
        # -----------------------------------------

        references = []
        seen = set()

        for result in retrieval_results:

            key = (
                result.get("source"),
                result.get("chunk_id"),
            )

            if key in seen:
                continue

            seen.add(key)

            references.append({
                field: result.get(field)
                for field in (
                    "filename",
                    "source",
                    "file_type",
                    "chunk_id",
                    "keyword_score",
                    "similarity_score",
                    "hybrid_score",
                    "detected_incident",
                )
            })

        assessment = {
            "assessment_type":
                "prototype_preliminary_assessment",

            "status": status,

            "matched_requirements": matched,

            "missing_requirements": missing,

            "unverified_requirements": unverified,

            "references": references,

            "disclaimer": (
                "This is a prototype preliminary assessment "
                "and not a legal determination of maritime "
                "compliance. Human review is required."
            ),
        }

        self._save_assessment(
            incident_description,
            assessment,
        )

        return assessment


compliance_service = ComplianceService()
