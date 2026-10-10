
import re
from typing import Any, Dict, List


# --------------------------------------------------
# DOCUMENT STRUCTURE
# --------------------------------------------------

METADATA_FIELDS = (
    "TITLE",
    "CATEGORY",
    "INCIDENT TYPE",
    "PURPOSE",
    "KEYWORDS",
    "RELATED KNOWLEDGE",
    "SOURCE ORGANIZATION",
    "SOURCE",
    "REFERENCE",
)

CONTENT_FIELDS = (
    "RESPONSE ACTIONS",
    "KEY REQUIREMENTS AND AREAS",
    "SUMMARY",
    "EMERGENCY PROCEDURES",
    "SAFETY REQUIREMENTS",
    "RELEVANT REGULATIONS",
)

ALL_FIELDS = METADATA_FIELDS + CONTENT_FIELDS

FIELD_PATTERN = re.compile(
    r"(?<!\w)(?:"
    + "|".join(
        re.escape(field)
        for field in sorted(ALL_FIELDS, key=len, reverse=True)
    )
    + r")\s*:",
    re.IGNORECASE,
)

REGULATION_PATTERN = re.compile(
    r"(?<!\w)(?=Regulation\s+\d+\s*[-–])",
    re.IGNORECASE,
)


# --------------------------------------------------
# TEXT FORMATTING
# --------------------------------------------------

def normalize_text(text: str) -> str:
    """
    Fix common formatting issues introduced during
    document extraction.
    """

    text = str(text or "")

    text = text.replace("\r\n", "\n")

    # Fix punctuation without spaces.
    text = re.sub(
        r"([.!?])(?=[A-Za-z])",
        r"\1 ",
        text,
    )

    # Fix a known extraction issue.
    text = re.sub(
        r"\bfirewhen\b",
        "fire when",
        text,
        flags=re.IGNORECASE,
    )

    # Remove unnecessary spaces.
    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    # Fix common joined words in retrieved text.
    text = re.sub(
        r"fire\s*when\b",
        "fire when",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"tankers\s*\.\s*and\b",
        "tankers. And",
        text,
        flags=re.IGNORECASE,
    )

    return text.strip()


# --------------------------------------------------
# METADATA CLEANING
# --------------------------------------------------

def clean_reference_content(content: str) -> str:
    """
    Remove document metadata while preserving
    actual emergency procedures and safety requirements.

    Supports flattened single-line retrieved chunks.
    """

    if not content:
        return ""

    text = normalize_text(content)

    matches = list(
        FIELD_PATTERN.finditer(text)
    )

    if not matches:
        cleaned = text

    else:
        cleaned_parts = []

        # Preserve text before the first heading.
        prefix = text[:matches[0].start()].strip()

        if prefix:
            cleaned_parts.append(prefix)

        for index, match in enumerate(matches):
            field = (
                match.group(0)
                .split(":")[0]
                .strip()
                .upper()
            )

            end = (
                matches[index + 1].start()
                if index + 1 < len(matches)
                else len(text)
            )

            value = text[
                match.end():end
            ].strip()

            if not value:
                continue

            # Preserve useful document content only.
            if field in CONTENT_FIELDS:
                cleaned_parts.append(value)

        cleaned = "\n".join(cleaned_parts)

    # Separate regulation entries.
    cleaned = REGULATION_PATTERN.sub(
        "\n",
        cleaned,
    )

    # Fix punctuation spacing again.
    cleaned = re.sub(
        r"([.!?])(?=[A-Za-z])",
        r"\1 ",
        cleaned,
    )

    return cleaned.strip()


# --------------------------------------------------
# SENTENCE EXTRACTION
# --------------------------------------------------

def _sentences(content: str) -> List[str]:
    """
    Extract readable sentences, numbered emergency
    actions and individual regulation entries.
    """

    cleaned = clean_reference_content(content)

    if not cleaned:
        return []

    # Split numbered response actions.
    cleaned = re.sub(
        r"\s+(?=\d{1,2}[.)]\s+[A-Za-z])",
        "\n",
        cleaned,
    )

    # Split SOLAS regulation entries.
    cleaned = REGULATION_PATTERN.sub(
        "\n",
        cleaned,
    )

    sentences = []
    seen = set()

    for line in cleaned.splitlines():

        # Remove numbered-list prefix.
        line = re.sub(
            r"^\s*\d{1,2}[.)]\s+",
            "",
            line,
        ).strip()

        # Remove bullet markers.
        line = re.sub(
            r"^[-*•]\s+",
            "",
            line,
        )

        parts = re.split(
            r"(?<=[.!?])\s+|(?<=;)\s+",
            line,
        )

        for part in parts:
            sentence = re.sub(
                r"\s+",
                " ",
                part,
            ).strip(" -•\t")

            if len(sentence) < 20:
                continue

            key = sentence.casefold()

            if key not in seen:
                seen.add(key)
                sentences.append(sentence)

    return sentences


# --------------------------------------------------
# INCIDENT-AWARE EXTRACTIVE SUMMARY
# --------------------------------------------------

def summarize_reference(
    content: str,
    query: str,
    max_sentences: int = 3,
    max_chars: int = 500,
) -> str:
    """
    Select incident-relevant sentences from retrieved
    maritime documents.

    This is extractive summarization:
    it does not invent instructions or legal claims.
    """

    sentences = _sentences(content)

    if not sentences:
        return ""

    stopwords = {
        "the", "and", "for", "with", "from",
        "this", "that", "have", "been",
        "into", "what", "should", "would",
        "could", "about", "during", "where",
        "which", "their", "there", "when",
        "were", "are", "was", "has",
        "had", "can", "will", "may",
        "all", "any", "its", "not",
    }

    query_terms = {
        term
        for term in re.findall(
            r"[a-zA-Z]{3,}",
            str(query).lower(),
        )
        if term not in stopwords
    }

    action_terms = {
        "shall", "must", "notify", "report",
        "alarm", "evacuate", "protect",
        "respond", "emergency", "procedure",
        "safety", "required", "isolate",
        "muster", "escape", "fire",
        "collision", "rescue", "containment",
        "detection", "extinction",
    }

    ranked = []

    for index, sentence in enumerate(sentences):

        terms = set(
            re.findall(
                r"[a-zA-Z]{3,}",
                sentence.lower(),
            )
        )

        overlap = len(
            query_terms & terms
        )

        action_overlap = len(
            action_terms & terms
        )

        score = (
            overlap * 3
            + min(action_overlap, 3)
        )

        ranked.append(
            (score, index, sentence)
        )

    # Rank sentences by relevance.
    ranked.sort(
        key=lambda item: (
            -item[0],
            item[1],
        )
    )

    selected = ranked[:max_sentences]

    # Preserve original source order.
    selected.sort(
        key=lambda item: item[1]
    )

    summary = " ".join(
        item[2]
        for item in selected
    )

    # Limit summary length.
    if len(summary) > max_chars:

        truncated = summary[:max_chars]

        last_space = truncated.rfind(" ")

        if last_space > 0:
            truncated = truncated[:last_space]

        summary = truncated.rstrip(" ,;:")

        if summary and summary[-1] not in ".!?":
            summary += "..."

    return summary


# --------------------------------------------------
# ATTACH SUMMARIES TO REFERENCES
# --------------------------------------------------

def add_reference_summaries(
    references: List[Dict[str, Any]],
    retrieval_results: List[Dict[str, Any]],
    query: str,
) -> List[Dict[str, Any]]:
    """
    Add source-grounded summaries to retrieved references.

    Combine up to two highest-ranked chunks per source.
    Duplicate references share the same summary.
    """

    chunks_by_source = {}

    for result in retrieval_results:

        source = result.get("source")
        content = result.get("content")

        if not source or not content:
            continue

        chunks_by_source.setdefault(
            source, []
        ).append(result)

    enriched = []
    summary_cache = {}

    for reference in references:

        item = dict(reference)
        source = item.get("source")

        if source not in summary_cache:

            chunks = chunks_by_source.get(
                source, []
            )

            chunks = sorted(
                chunks,
                key=lambda chunk: float(
                    chunk.get("hybrid_score") or 0
                ),
                reverse=True,
            )

            combined_content = "\n".join(
                str(
                    chunk.get("content") or ""
                ).strip()
                for chunk in chunks[:2]
                if chunk.get("content")
            )

            summary_cache[source] = (
                summarize_reference(
                    content=combined_content,
                    query=query,
                    max_sentences=3,
                    max_chars=500,
                )
            )

        item["summary"] = (
            summary_cache[source]
        )

        item["summary_type"] = "extractive"

        enriched.append(item)

    return enriched
