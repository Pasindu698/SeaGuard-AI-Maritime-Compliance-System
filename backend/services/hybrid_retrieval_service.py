from typing import Any, Dict, List, Optional

from backend.services.retrieval_service import retrieval_service
from backend.services.vector_service import vector_service


class HybridRetrievalService:
    """
    Hybrid retrieval service for SeaGuard AI.

    Combines:
    1. Keyword + incident-aware retrieval
    2. ChromaDB semantic vector retrieval
    3. Semantic incident detection
    4. Incident-aware re-ranking
    5. Operational-intent-aware re-ranking
    """

    # -------------------------------------------------
    # INCIDENT-SPECIFIC SOURCE HINTS
    # -------------------------------------------------

    INCIDENT_SOURCE_HINTS = {
        "fire": {
            "fire_emergency.txt",
            "solas_fire_safety.txt",
            "imo_fire_safety.pdf"
        },

        "collision": {
            "collision_emergency.txt",
            "imo_navigation_safety.pdf",
            "msc.255(84).pdf",
            "imo_casualty_investigation.pdf"
        },

        "person_overboard": {
            "person_overboard.txt",
            "solas_life_saving.txt",
            "imo_life_saving.pdf",
            "imo_distress_communications.pdf"
        },

        "security": {
            "imo_maritime_security.pdf"
        },

        "dangerous_goods": {
            "imo_dangerous_goods_safety.pdf"
        }
    }

    # -------------------------------------------------
    # EMERGENCY PROCEDURE FILE MARKERS
    # -------------------------------------------------

    INCIDENT_FILE_MARKERS = {
        "fire": {
            "fire_emergency.txt"
        },

        "collision": {
            "collision_emergency.txt"
        },

        "person_overboard": {
            "person_overboard.txt"
        }
    }

    # -------------------------------------------------
    # OPERATIONAL SOURCE HINTS
    # -------------------------------------------------

    OPERATIONAL_SOURCE_HINTS = {
        "fire": {
            "fire_emergency.txt",
            "solas_fire_safety.txt",
            "imo_fire_safety.pdf"
        },

        "collision": {
            "collision_emergency.txt",
            "imo_navigation_safety.pdf"
        },

        "person_overboard": {
            "person_overboard.txt",
            "solas_life_saving.txt",
            "imo_life_saving.pdf",
            "imo_distress_communications.pdf"
        },

        "security": {
            "imo_maritime_security.pdf"
        },

        "dangerous_goods": {
            "imo_dangerous_goods_safety.pdf"
        }
    }

    # -------------------------------------------------
    # POST-INCIDENT / INVESTIGATION SOURCES
    # -------------------------------------------------

    INVESTIGATION_SOURCE_HINTS = {
        "msc.255(84).pdf",
        "imo_casualty_investigation.pdf"
    }

    # -------------------------------------------------
    # HYBRID SEARCH
    # -------------------------------------------------

    def search(
        self,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:

        query = query.strip()

        if not query:
            return []

        limit = max(
            1,
            min(limit, 10)
        )

        # Retrieve more candidates before final ranking.
        candidate_limit = 10

        # ---------------------------------------------
        # 1. KEYWORD / INCIDENT-AWARE SEARCH
        # ---------------------------------------------

        keyword_results = retrieval_service.search(
            query=query,
            limit=candidate_limit
        )

        # ---------------------------------------------
        # 2. VECTOR SEMANTIC SEARCH
        # ---------------------------------------------

        vector_results = vector_service.semantic_search(
            query=query,
            limit=candidate_limit
        )

        # ---------------------------------------------
        # 3. DETECT INCIDENT
        # ---------------------------------------------

        detected_incident = self._detect_incident(
            query=query,
            vector_results=vector_results
        )

        # ---------------------------------------------
        # 4. DETECT QUERY INTENT
        # ---------------------------------------------

        operational_intent = (
            self._detect_operational_intent(
                query
            )
        )

        # ---------------------------------------------
        # 5. MERGE CANDIDATES
        # ---------------------------------------------

        merged = {}

        # Add keyword results.
        for rank, result in enumerate(
            keyword_results,
            start=1
        ):
            key = self._result_key(
                result
            )

            merged[key] = {
                "filename":
                    result["filename"],

                "source":
                    result["source"],

                "file_type":
                    result["file_type"],

                "chunk_id":
                    result["chunk_id"],

                "content":
                    result["content"],

                "keyword_score":
                    result["score"],

                "keyword_rank":
                    rank,

                "similarity_score":
                    0.0,

                "vector_rank":
                    None
            }

        # Add / merge vector results.
        for rank, result in enumerate(
            vector_results,
            start=1
        ):
            key = self._result_key(
                result
            )

            if key not in merged:

                merged[key] = {
                    "filename":
                        result["filename"],

                    "source":
                        result["source"],

                    "file_type":
                        result["file_type"],

                    "chunk_id":
                        result["chunk_id"],

                    "content":
                        result["content"],

                    "keyword_score":
                        0,

                    "keyword_rank":
                        None,

                    "similarity_score":
                        result["similarity_score"],

                    "vector_rank":
                        rank
                }

            else:

                merged[key]["similarity_score"] = (
                    result["similarity_score"]
                )

                merged[key]["vector_rank"] = rank

        # ---------------------------------------------
        # 6. HYBRID RE-RANKING
        # ---------------------------------------------

        final_results = []

        for result in merged.values():

            keyword_component = 0.0
            vector_component = 0.0
            agreement_bonus = 0.0
            incident_bonus = 0.0
            operational_bonus = 0.0

            investigation_penalty = 0.0
            conflict_penalty = 0.0

            # -----------------------------------------
            # KEYWORD COMPONENT
            # -----------------------------------------

            if result["keyword_rank"] is not None:

                keyword_component = (
                    0.30
                    / result["keyword_rank"]
                )

            # -----------------------------------------
            # SEMANTIC COMPONENT
            # -----------------------------------------

            vector_component = (
                result["similarity_score"]
                * 0.50
            )

            # -----------------------------------------
            # AGREEMENT BONUS
            # -----------------------------------------

            if (
                result["keyword_rank"] is not None
                and result["vector_rank"] is not None
            ):
                agreement_bonus = 0.10

            filename_lower = (
                result["filename"].lower()
            )

            # -----------------------------------------
            # INCIDENT-AWARE SOURCE BOOST
            # -----------------------------------------

            if detected_incident:

                preferred_sources = (
                    self.INCIDENT_SOURCE_HINTS.get(
                        detected_incident,
                        set()
                    )
                )

                if (
                    filename_lower
                    in preferred_sources
                ):
                    incident_bonus = 0.35

                # -------------------------------------
                # CONFLICTING EMERGENCY FILE PENALTY
                # -------------------------------------

                for (
                    incident_type,
                    filenames
                ) in self.INCIDENT_FILE_MARKERS.items():

                    if (
                        incident_type
                        == detected_incident
                    ):
                        continue

                    if filename_lower in filenames:
                        conflict_penalty = 0.50
                        break

            # -----------------------------------------
            # OPERATIONAL QUERY RE-RANKING
            # -----------------------------------------

            if (
                operational_intent
                and detected_incident
            ):

                operational_sources = (
                    self.OPERATIONAL_SOURCE_HINTS.get(
                        detected_incident,
                        set()
                    )
                )

                # Give additional priority to sources
                # useful for immediate crew response.
                if (
                    filename_lower
                    in operational_sources
                ):
                    operational_bonus = 0.20

                # Investigation sources remain available
                # but are pushed down for immediate
                # emergency-response questions.
                if (
                    filename_lower
                    in self.INVESTIGATION_SOURCE_HINTS
                ):
                    investigation_penalty = 0.30

            # -----------------------------------------
            # FINAL HYBRID SCORE
            # -----------------------------------------

            hybrid_score = (
                keyword_component
                + vector_component
                + agreement_bonus
                + incident_bonus
                + operational_bonus
                - investigation_penalty
                - conflict_penalty
            )

            final_results.append({
                "filename":
                    result["filename"],

                "source":
                    result["source"],

                "file_type":
                    result["file_type"],

                "chunk_id":
                    result["chunk_id"],

                "keyword_score":
                    result["keyword_score"],

                "similarity_score":
                    result["similarity_score"],

                "detected_incident":
                    detected_incident,

                "hybrid_score":
                    round(
                        hybrid_score,
                        4
                    ),

                "content":
                    result["content"]
            })

        # ---------------------------------------------
        # 7. SORT RESULTS
        # ---------------------------------------------

        final_results.sort(
            key=lambda item:
                item["hybrid_score"],
            reverse=True
        )

        # ---------------------------------------------
        # 8. RESULT DIVERSITY + INTENT FILTERING
        # ---------------------------------------------

        diverse_results = []

        source_counts = {}

        max_chunks_per_source = 2

        for result in final_results:

            source = result["source"]

            filename_lower = (
                result["filename"].lower()
            )

            current_count = source_counts.get(
                source,
                0
            )

            if (
                current_count
                >= max_chunks_per_source
            ):
                continue

            # Do not return strongly penalized results.
            if result["hybrid_score"] <= 0:
                continue

            # -----------------------------------------
            # OPERATIONAL QUERY FILTER
            # -----------------------------------------
            #
            # Investigation documents are useful for
            # post-incident analysis and reporting.
            #
            # However, when the user explicitly asks
            # for immediate crew actions or emergency
            # procedures, investigation-only documents
            # should not occupy the final top results.
            #
            # They are NOT removed from the knowledge
            # base and remain available for investigation
            # or reporting queries.
            # -----------------------------------------

            if (
                operational_intent
                and filename_lower
                in self.INVESTIGATION_SOURCE_HINTS
            ):
                continue

            diverse_results.append(
                result
            )

            source_counts[source] = (
                current_count + 1
            )

            if len(diverse_results) >= limit:
                break

        return diverse_results

    # -------------------------------------------------
    # OPERATIONAL QUERY INTENT DETECTION
    # -------------------------------------------------

    def _detect_operational_intent(
        self,
        query: str
    ) -> bool:
        """
        Detect whether the query is asking for
        immediate crew actions / emergency procedures
        rather than post-incident investigation.
        """

        query_lower = query.lower()

        operational_phrases = {
            "what should",
            "what should the crew do",
            "what should crew do",
            "what actions",
            "what action",
            "what procedures",
            "what procedure",
            "emergency procedure",
            "emergency procedures",
            "crew follow",
            "should follow",
            "respond",
            "response",
            "immediate action",
            "immediate actions",
            "what to do",
            "how should",
            "how to respond"
        }

        return any(
            phrase in query_lower
            for phrase in operational_phrases
        )

    # -------------------------------------------------
    # INCIDENT DETECTION
    # -------------------------------------------------

    def _detect_incident(
        self,
        query: str,
        vector_results: List[Dict[str, Any]]
    ) -> Optional[str]:

        query_lower = query.lower()

        # ---------------------------------------------
        # DIRECT QUERY DETECTION
        # ---------------------------------------------

        direct_terms = {
            "fire": {
                "fire",
                "smoke",
                "burning",
                "flame"
            },

            "collision": {
                "collision",
                "collided",
                "crash",
                "impact"
            },

            "person_overboard": {
                "person overboard",
                "man overboard",
                "crew overboard",
                "fell overboard",
                "overboard",
                "falls into the sea",
                "fell into the sea",
                "fallen into the sea",
                "falls into water",
                "fell into water",
                "someone in the sea",
                "someone in the water",
                "person in the sea",
                "person in the water"
            },

            "security": {
                "security breach",
                "unauthorized",
                "intruder",
                "piracy",
                "isps"
            },

            "dangerous_goods": {
                "dangerous goods",
                "hazardous cargo",
                "chemical spill",
                "hazardous material"
            }
        }

        for (
            incident_type,
            terms
        ) in direct_terms.items():

            if any(
                term in query_lower
                for term in terms
            ):
                return incident_type

        # ---------------------------------------------
        # SEMANTIC FALLBACK
        # ---------------------------------------------
        #
        # If literal query detection fails, inspect the
        # highest semantic vector results.
        # ---------------------------------------------

        incident_scores = {
            "fire": 0.0,
            "collision": 0.0,
            "person_overboard": 0.0
        }

        for result in vector_results[:5]:

            filename = (
                result["filename"].lower()
            )

            similarity = float(
                result["similarity_score"]
            )

            if filename == "fire_emergency.txt":

                incident_scores["fire"] = max(
                    incident_scores["fire"],
                    similarity
                )

            elif (
                filename
                == "collision_emergency.txt"
            ):

                incident_scores["collision"] = max(
                    incident_scores["collision"],
                    similarity
                )

            elif (
                filename
                == "person_overboard.txt"
            ):

                incident_scores[
                    "person_overboard"
                ] = max(
                    incident_scores[
                        "person_overboard"
                    ],
                    similarity
                )

        best_incident = max(
            incident_scores,
            key=incident_scores.get
        )

        best_score = incident_scores[
            best_incident
        ]

        # Require reasonable semantic evidence.
        if best_score >= 0.45:
            return best_incident

        return None

    # -------------------------------------------------
    # UNIQUE RESULT KEY
    # -------------------------------------------------

    def _result_key(
        self,
        result: Dict[str, Any]
    ) -> str:

        return (
            f'{result["source"]}'
            f'::{result["chunk_id"]}'
        )


# -----------------------------------------------------
# SINGLETON SERVICE INSTANCE
# -----------------------------------------------------

hybrid_retrieval_service = HybridRetrievalService()