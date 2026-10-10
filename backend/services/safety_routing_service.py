
import re
from typing import Dict, List


class SafetyRoutingService:

    # Explicit safety, security and compliance terms.
    SAFETY_TERMS = re.compile(
        r"\b("
        r"emergency|fire|smoke|collision|grounding|"
        r"overboard|man overboard|piracy|hijack|"
        r"flooding|explosion|injury|injured|"
        r"evacuation|distress|mayday|"
        r"hazardous|dangerous goods|"
        r"security breach|unauthorized access|"
        r"suspicious activity|"
        r"solas|marpol|imo|isps|ism code|"
        r"compliance|regulation|regulatory|"
        r"certificate|certification|"
        r"inspection|audit|violation|"
        r"legal requirement|safety procedure|"
        r"risk assessment|incident report"
        r")\b",
        re.IGNORECASE,
    )

    # Vessel-related operational contexts.
    MARITIME_CONTEXT = re.compile(
        r"\b("
        r"ship|ships|vessel|vessels|"
        r"crew|captain|seafarer|seafarers|"
        r"bridge|engine room|deck|"
        r"cargo|navigation|port|"
        r"maritime|marine|shipboard|"
        r"lifeboat|life jacket|"
        r"sea|onboard|on board"
        r")\b",
        re.IGNORECASE,
    )

    # Questions involving decisions or actions.
    OPERATIONAL_INTENT = re.compile(
        r"\b("
        r"should|must|need to|required|"
        r"allowed|permitted|safe to|"
        r"what to do|what steps|"
        r"how to respond|how to handle|"
        r"how to prevent|how to manage|"
        r"what happens if|can we|"
        r"can the|can a|"
        r"procedure|protocol|"
        r"operate|sail|depart|"
        r"respond|rescue|protect|"
        r"report|investigate|"
        r"assess|mitigate|"
        r"identify the cause|"
        r"what actions|take action"
        r")\b",
        re.IGNORECASE,
    )

    # Incident descriptions without explicit
    # emergency terminology.
    INCIDENT_SIGNALS = re.compile(
        r"\b("
        r"falls? into (?:the )?(?:sea|water)|"
        r"fell into (?:the )?(?:sea|water)|"
        r"person (?:in|in the) water|"
        r"water (?:is )?entering|"
        r"loss of propulsion|"
        r"engine failure|"
        r"power failure|"
        r"loss of steering|"
        r"missing crew|"
        r"unconscious|"
        r"not responding|"
        r"oil spill|"
        r"gas leak|"
        r"taking on water"
        r")\b",
        re.IGNORECASE,
    )

    @classmethod
    def classify(cls, question: str) -> Dict:

        question = (question or "").strip()

        if not question:
            return {
                "safety_related": False,
                "reason": "empty_question",
            }

        if cls.SAFETY_TERMS.search(question):
            return {
                "safety_related": True,
                "reason": "explicit_safety_term",
            }

        if cls.INCIDENT_SIGNALS.search(question):
            return {
                "safety_related": True,
                "reason": "incident_signal",
            }

        maritime = bool(
            cls.MARITIME_CONTEXT.search(question)
        )

        operational = bool(
            cls.OPERATIONAL_INTENT.search(question)
        )

        if maritime and operational:
            return {
                "safety_related": True,
                "reason": "maritime_operational_intent",
            }

        return {
            "safety_related": False,
            "reason": "general_question",
        }

    @classmethod
    def is_safety_related(
        cls,
        question: str,
        history: List[Dict] = None,
    ) -> bool:

        result = cls.classify(question)

        if result["safety_related"]:
            return True

        # Preserve safety context for follow-up
        # questions such as "What about the crew?"
        if history:
            recent_user_messages = [
                str(item.get("content") or "")
                for item in history[-6:]
                if item.get("role") == "user"
            ]

            # A short follow-up may depend on the
            # preceding safety-related question.
            if len(question.split()) <= 12:
                for previous in recent_user_messages[-2:]:
                    if cls.classify(previous)[
                        "safety_related"
                    ]:
                        return True

        return False


safety_routing_service = SafetyRoutingService()
