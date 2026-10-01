from pathlib import Path
from typing import List, Dict

from pypdf import PdfReader


class RetrievalService:

    def __init__(self):

        # Project root:
        # SeaGuard-AI-Maritime-Compliance-System/
        self.project_root = (
            Path(__file__).resolve().parents[2]
        )

        self.knowledge_base_path = (
            self.project_root / "knowledge_base"
        )

    # -------------------------------------------------
    # TXT FILE READER
    # -------------------------------------------------

    def read_txt_file(
        self,
        file_path: Path
    ) -> str:

        try:
            return file_path.read_text(
                encoding="utf-8"
            ).strip()

        except Exception as error:
            print(
                f"Error reading TXT file "
                f"{file_path.name}: {error}"
            )

            return ""

    # -------------------------------------------------
    # PDF FILE READER
    # -------------------------------------------------

    def read_pdf_file(
        self,
        file_path: Path
    ) -> str:

        try:
            reader = PdfReader(
                str(file_path)
            )

            pages = []

            for page in reader.pages:

                text = page.extract_text()

                if text:
                    pages.append(text)

            return "\n".join(
                pages
            ).strip()

        except Exception as error:
            print(
                f"Error reading PDF file "
                f"{file_path.name}: {error}"
            )

            return ""

    # -------------------------------------------------
    # LOAD KNOWLEDGE BASE
    # -------------------------------------------------

    def load_documents(
        self
    ) -> List[Dict]:

        documents = []

        if not self.knowledge_base_path.exists():

            print(
                "Knowledge base folder not found: "
                f"{self.knowledge_base_path}"
            )

            return documents

        # Load TXT files
        for file_path in (
            self.knowledge_base_path.rglob("*.txt")
        ):

            content = self.read_txt_file(
                file_path
            )

            if content:

                documents.append({
                    "filename": file_path.name,

                    "source": str(
                        file_path.relative_to(
                            self.knowledge_base_path
                        )
                    ),

                    "file_type": "TXT",

                    "content": content
                })

        # Load PDF files
        for file_path in (
            self.knowledge_base_path.rglob("*.pdf")
        ):

            content = self.read_pdf_file(
                file_path
            )

            if content:

                documents.append({
                    "filename": file_path.name,

                    "source": str(
                        file_path.relative_to(
                            self.knowledge_base_path
                        )
                    ),

                    "file_type": "PDF",

                    "content": content
                })

        return documents

    # -------------------------------------------------
    # CHUNK DOCUMENT TEXT
    # -------------------------------------------------

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 1000,
        overlap: int = 150
    ) -> List[str]:

        cleaned_text = " ".join(
            text.split()
        )

        if not cleaned_text:
            return []

        chunks = []

        start = 0

        text_length = len(
            cleaned_text
        )

        while start < text_length:

            end = min(
                start + chunk_size,
                text_length
            )

            chunk = cleaned_text[
                start:end
            ].strip()

            if chunk:
                chunks.append(chunk)

            if end >= text_length:
                break

            start = end - overlap

        return chunks

    # -------------------------------------------------
    # CREATE SEARCHABLE CHUNKS
    # -------------------------------------------------

    def build_chunks(
        self
    ) -> List[Dict]:

        documents = self.load_documents()

        all_chunks = []

        for document in documents:

            chunks = self.chunk_text(
                document["content"]
            )

            for index, chunk in enumerate(
                chunks,
                start=1
            ):

                all_chunks.append({
                    "filename": (
                        document["filename"]
                    ),

                    "source": (
                        document["source"]
                    ),

                    "file_type": (
                        document["file_type"]
                    ),

                    "chunk_id": index,

                    "content": chunk
                })

        return all_chunks

    # -------------------------------------------------
    # KEYWORD + INCIDENT-AWARE RETRIEVAL
    # -------------------------------------------------

    def search(
        self,
        query: str,
        limit: int = 5
    ) -> List[Dict]:

        chunks = self.build_chunks()

        query_lower = (
            query.lower().strip()
        )

        # ---------------------------------------------
        # GENERIC STOP WORDS
        # ---------------------------------------------

        stop_words = {
            "the",
            "and",
            "for",
            "with",
            "from",
            "this",
            "that",
            "procedure",
            "procedures",
            "response",
            "emergency"
        }

        query_words = {
            word.lower()
            for word in query.split()
            if (
                len(word) > 2
                and word.lower()
                not in stop_words
            )
        }

        # ---------------------------------------------
        # INCIDENT-SPECIFIC CONCEPTS
        # ---------------------------------------------

        incident_terms = {

            "fire": {
                "fire",
                "smoke",
                "burning",
                "firefighting",
                "fire-fighting"
            },

            "collision": {
                "collision",
                "collided",
                "impact",
                "flooding",
                "water ingress"
            },

            "person_overboard": {
                "person overboard",
                "man overboard",
                "crew overboard",
                "fell overboard",
                "overboard",
                "mob",
                "lifebuoy",
                "recovery"
            },

            "security": {
                "security",
                "unauthorized",
                "intruder",
                "isps",
                "security breach"
            },

            "dangerous_goods": {
                "dangerous goods",
                "hazardous",
                "cargo",
                "chemical",
                "spill"
            }
        }

        # ---------------------------------------------
        # PREFERRED SOURCES
        # ---------------------------------------------
        #
        # These sources receive an additional relevance
        # bonus when their incident type matches the
        # user's query.
        # ---------------------------------------------

        incident_source_hints = {

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

        # ---------------------------------------------
        # DETECT MAIN INCIDENT TYPE
        # ---------------------------------------------

        detected_incident = None

        for incident_type, terms in (
            incident_terms.items()
        ):

            if any(
                term in query_lower
                for term in terms
            ):

                detected_incident = (
                    incident_type
                )

                break

        results = []

        # ---------------------------------------------
        # SCORE EVERY CHUNK
        # ---------------------------------------------

        for chunk in chunks:

            content_lower = (
                chunk["content"].lower()
            )

            filename_lower = (
                chunk["filename"].lower()
            )

            source_lower = (
                chunk["source"].lower()
            )

            searchable_text = (
                filename_lower
                + " "
                + content_lower
            )

            score = 0

            # -----------------------------------------
            # 1. NORMAL KEYWORD MATCHING
            # -----------------------------------------

            for word in query_words:

                if word in content_lower:
                    score += 2

                if word in filename_lower:
                    score += 4

            # -----------------------------------------
            # 2. EXACT QUERY PHRASE BONUS
            # -----------------------------------------

            if (
                len(query_lower) > 3
                and query_lower
                in searchable_text
            ):
                score += 10

            # -----------------------------------------
            # 3. INCIDENT-SPECIFIC BONUS
            # -----------------------------------------

            if detected_incident:

                relevant_terms = (
                    incident_terms[
                        detected_incident
                    ]
                )

                incident_match_count = sum(
                    1
                    for term in relevant_terms
                    if term in searchable_text
                )

                score += (
                    incident_match_count * 5
                )

                # Strong bonus if the filename itself
                # represents the detected incident.

                incident_filename = (
                    detected_incident.replace(
                        "_",
                        " "
                    )
                )

                if (
                    detected_incident
                    in filename_lower
                    or incident_filename
                    in filename_lower
                ):
                    score += 15

            # -----------------------------------------
            # 4. PENALIZE CONFLICTING INCIDENT FILES
            # -----------------------------------------

            if detected_incident:

                for (
                    other_incident,
                    other_terms
                ) in incident_terms.items():

                    if (
                        other_incident
                        == detected_incident
                    ):
                        continue

                    other_filename = (
                        other_incident.replace(
                            "_",
                            " "
                        )
                    )

                    if (
                        other_incident
                        in filename_lower
                        or other_filename
                        in filename_lower
                    ):
                        score -= 15

            # -----------------------------------------
            # 5. OFFICIAL PDF SOURCE BONUS
            # -----------------------------------------

            # Official IMO documents are useful
            # supporting references, so all official
            # PDFs receive a small bonus.

            if (
                chunk["file_type"] == "PDF"
                and "official_documents"
                in source_lower
            ):
                score += 3

            # -----------------------------------------
            # 6. INCIDENT-SOURCE RELEVANCE
            # -----------------------------------------

            if detected_incident:

                preferred_sources = (
                    incident_source_hints.get(
                        detected_incident,
                        set()
                    )
                )

                # Directly relevant source gets a
                # stronger relevance bonus.

                if (
                    filename_lower
                    in preferred_sources
                ):
                    score += 8

                # Official PDF, but not one of the
                # preferred documents for this
                # incident. Reduce its ranking.
                #
                # This helps prevent unrelated PDFs
                # such as ship-design documents from
                # appearing above life-saving sources
                # for person-overboard incidents.

                elif (
                    chunk["file_type"] == "PDF"
                    and "official_documents"
                    in source_lower
                ):
                    score -= 5

            # -----------------------------------------
            # 7. KEEP ONLY MEANINGFUL RESULTS
            # -----------------------------------------

            if score > 0:

                results.append({

                    "filename": (
                        chunk["filename"]
                    ),

                    "source": (
                        chunk["source"]
                    ),

                    "file_type": (
                        chunk["file_type"]
                    ),

                    "chunk_id": (
                        chunk["chunk_id"]
                    ),

                    "score": score,

                    "content": (
                        chunk["content"]
                    )
                })

        # ---------------------------------------------
        # SORT BY RELEVANCE SCORE
        # ---------------------------------------------

        results.sort(
            key=lambda item: item["score"],
            reverse=True
        )

        # ---------------------------------------------
        # RESULT DIVERSITY
        # ---------------------------------------------
        #
        # Prevent the result list from being completely
        # filled by chunks from one document.
        #
        # Maximum two chunks per source.
        # ---------------------------------------------

        diverse_results = []

        source_counts = {}

        max_chunks_per_source = 2

        for result in results:

            source = result["source"]

            current_count = (
                source_counts.get(
                    source,
                    0
                )
            )

            if (
                current_count
                >= max_chunks_per_source
            ):
                continue

            diverse_results.append(
                result
            )

            source_counts[source] = (
                current_count + 1
            )

            if (
                len(diverse_results)
                >= limit
            ):
                break

        return diverse_results


# -----------------------------------------------------
# SINGLETON SERVICE INSTANCE
# -----------------------------------------------------

retrieval_service = RetrievalService()