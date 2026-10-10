
import { useEffect, useMemo, useState } from "react";

import {
  BookOpen,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Quote,
  ShieldCheck,
  Eye,
} from "lucide-react";

import OriginalDocumentModal from "./OriginalDocumentModal";

// ========================================
// FORMAT SOURCE EVIDENCE
// ========================================

function formatEvidence(text) {
  if (!text) return [];

  const formatted = String(text)
    .replace(/\s+(?=\d{1,2}[.)]\s+[A-Za-z])/g, "\n")
    .replace(/\s*(?=Regulation\s+\d+\s*[-–])/gi, "\n")
    .replace(/([.!?])(?=[A-Za-z])/g, "$1 ");

  return formatted
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function mayStartMidSentence(text) {
  const trimmed = String(text || "").trim();
  return Boolean(trimmed) && /^[a-z]/.test(trimmed);
}

// ========================================
// REFERENCES PANEL
// ========================================

export default function ReferencesPanel({
  references,
  sourceGroups = [],
  activeSourceKey,
  citationRequest,
  token,
}) {
  const [showLimit, setShowLimit] = useState("5");

  const [expandedSources, setExpandedSources] =
    useState({});

  const [expandedEvidence, setExpandedEvidence] =
    useState({});

  const [previewDocument, setPreviewDocument] =
    useState(null);

  // ========================================
  // GROUP REFERENCES BY SOURCE
  // ========================================

  const groupedReferences = useMemo(() => {
    if (!Array.isArray(references)) return [];

    const groups = new Map();

    references.forEach((reference, index) => {
      const key =
        reference.source ||
        reference.filename ||
        `unknown-${index}`;

      if (!groups.has(key)) {
        groups.set(key, {
          ...reference,
          key,
          hitCount: 0,
          bestScore: null,
          summary: "",
          evidenceItems: [],
        });
      }

      const group = groups.get(key);

      group.hitCount += 1;

      const score = Number(reference.hybrid_score);

      if (
        reference.hybrid_score != null &&
        Number.isFinite(score)
      ) {
        group.bestScore =
          group.bestScore === null
            ? score
            : Math.max(group.bestScore, score);
      }

      if (
        !group.summary &&
        typeof reference.summary === "string" &&
        reference.summary.trim()
      ) {
        group.summary = reference.summary.trim();
      }

      const evidence =
        typeof reference.evidence === "string"
          ? reference.evidence.trim()
          : "";

      if (
        evidence &&
        !group.evidenceItems.some(
          (item) => item.text === evidence
        )
      ) {
        group.evidenceItems.push({
          id: `${key}-evidence-${index}`,
          text: evidence,
        });
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) =>
        (b.bestScore ?? -Infinity) -
        (a.bestScore ?? -Infinity)
    );
  }, [references]);

  const visibleReferences =
    showLimit === "all"
      ? groupedReferences
      : groupedReferences.slice(0, Number(showLimit));

  // ========================================
  // AUTO EXPAND CITED SOURCE
  // ========================================

  useEffect(() => {
    if (!activeSourceKey || !citationRequest) return;

    setShowLimit("all");

    setExpandedSources((previous) => ({
      ...previous,
      [activeSourceKey]: true,
    }));

    setExpandedEvidence((previous) => ({
      ...previous,
      [activeSourceKey]: true,
    }));
  }, [activeSourceKey, citationRequest]);

  // ========================================
  // SCROLL TO CITED SOURCE
  // ========================================

  useEffect(() => {
    if (!activeSourceKey || !citationRequest) return;

    const source = sourceGroups.find(
      (item) => item.key === activeSourceKey
    );

    if (!source) return;

    const frame = requestAnimationFrame(() => {
      document
        .getElementById(
          `aiw-source-${source.citationId}`
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    });

    return () => cancelAnimationFrame(frame);
  }, [
    activeSourceKey,
    citationRequest,
    showLimit,
    expandedSources,
    expandedEvidence,
    sourceGroups,
  ]);

  // ========================================
  // TOGGLE SUMMARY AND EVIDENCE
  // ========================================

  const toggleSummary = (key) => {
    setExpandedSources((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const toggleEvidence = (key) => {
    setExpandedEvidence((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  // ========================================
  // ORIGINAL DOCUMENT PREVIEW
  // ========================================

  const handleViewDocument = (reference) => {
    setPreviewDocument({
      source: reference.source,
      filename: reference.filename,
    });
  };

  if (
    !Array.isArray(references) ||
    references.length === 0
  ) {
    return null;
  }

  // ========================================
  // COMPONENT UI
  // ========================================

  return (
    <section className="aiw-result-section">

      {/* SECTION HEADING */}

      <div className="aiw-section-heading">
        <BookOpen size={22} />
        <h3>Retrieved Maritime References</h3>
      </div>

      <p className="aiw-section-description">
        Explore maritime references, source-grounded
        summaries, and supporting retrieved evidence.
      </p>

      {/* SOURCE STATISTICS */}

      <div className="aiw-reference-summary">
        <div className="aiw-reference-summary-card">
          <FileText size={21} />

          <div>
            <strong>{groupedReferences.length}</strong>
            <span>Unique Sources</span>
          </div>
        </div>

        <div className="aiw-reference-summary-card">
          <Layers size={21} />

          <div>
            <strong>{references.length}</strong>
            <span>Retrieval Hits</span>
          </div>
        </div>
      </div>

      {/* REFERENCE TOOLBAR */}

      <div className="aiw-reference-toolbar">
        <div>
          <strong>Reference Documents</strong>

          <p>
            Showing {visibleReferences.length} of{" "}
            {groupedReferences.length} sources
          </p>
        </div>

        <div className="aiw-reference-filter">
          <label htmlFor="aiw-reference-limit">
            Show
          </label>

          <select
            id="aiw-reference-limit"
            value={showLimit}
            onChange={(event) =>
              setShowLimit(event.target.value)
            }
          >
            <option value="3">3 Sources</option>
            <option value="5">5 Sources</option>
            <option value="10">10 Sources</option>
            <option value="all">All Sources</option>
          </select>
        </div>
      </div>

      {/* REFERENCE CARDS */}

      <div className="aiw-reference-list">
        {visibleReferences.map((reference, index) => {
          const expanded = Boolean(
            expandedSources[reference.key]
          );

          const evidenceOpen = Boolean(
            expandedEvidence[reference.key]
          );

          const sourceInfo = sourceGroups.find(
            (source) => source.key === reference.key
          );

          const citationId = sourceInfo?.citationId;

          const isActive =
            activeSourceKey === reference.key;

          return (
            <article
              key={reference.key}
              id={
                citationId
                  ? `aiw-source-${citationId}`
                  : undefined
              }
              className={`aiw-reference-card ${
                isActive ? "aiw-reference-active" : ""
              }`}
            >

              {/* REFERENCE NUMBER */}

              <div className="aiw-reference-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* LEFT SIDE: DOCUMENT DETAILS */}

              <div className="aiw-reference-content">

                <div className="aiw-reference-title-row">
                  <strong>
                    {reference.filename ||
                      "Maritime Reference"}
                  </strong>

                  {citationId && (
                    <span className="aiw-source-id">
                      {citationId}
                    </span>
                  )}
                </div>

                <div className="aiw-reference-tags">
                  <span>
                    {reference.file_type || "Document"}
                  </span>

                  {reference.detected_incident && (
                    <span>
                      {reference.detected_incident.replaceAll(
                        "_",
                        " "
                      )}
                    </span>
                  )}

                  <span>
                    {reference.hitCount}{" "}
                    {reference.hitCount === 1
                      ? "Retrieval Hit"
                      : "Retrieval Hits"}
                  </span>
                </div>

                {/* EXPANDED SOURCE DETAILS */}

                {expanded && (
                  <>
                    {/* SOURCE SUMMARY */}

                    <div className="aiw-ai-summary">
                      <div className="aiw-ai-summary-heading">
                        <Sparkles size={18} />
                        <h4>
                          Relevant Reference Summary
                        </h4>
                      </div>

                      {reference.summary ? (
                        <p>{reference.summary}</p>
                      ) : (
                        <p>
                          No source-grounded summary is
                          available for this reference.
                        </p>
                      )}

                      <div className="aiw-ai-summary-note">
                        <Info size={15} />

                        <span>
                          Extracted from retrieved document
                          content. This is not a full-document
                          summary or verified compliance advice.
                        </span>
                      </div>
                    </div>

                    {/* SOURCE EVIDENCE */}

                    <div className="aiw-evidence-section">
                      <button
                        type="button"
                        className="aiw-evidence-toggle"
                        onClick={() =>
                          toggleEvidence(reference.key)
                        }
                        aria-expanded={evidenceOpen}
                      >
                        <span>
                          <Quote size={17} />
                          Source Evidence Preview
                        </span>

                        {evidenceOpen ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>

                      {evidenceOpen && (
                        <div className="aiw-evidence-content">

                          {reference.evidenceItems.length > 0 ? (
                            reference.evidenceItems.map(
                              (item, evidenceIndex) => (
                                <div
                                  className="aiw-evidence-item"
                                  key={item.id}
                                >
                                  <div className="aiw-evidence-label">
                                    <FileText size={15} />

                                    Retrieved Excerpt{" "}
                                    {evidenceIndex + 1}
                                  </div>

                                  {mayStartMidSentence(
                                    item.text
                                  ) && (
                                    <div className="aiw-evidence-context-note">
                                      <Info size={14} />

                                      <span>
                                        This excerpt may begin
                                        partway through a sentence
                                        in the original document.
                                      </span>
                                    </div>
                                  )}

                                  <div className="aiw-evidence-lines">
                                    {formatEvidence(
                                      item.text
                                    ).map(
                                      (line, lineIndex) => (
                                        <p
                                          className="aiw-evidence-line"
                                          key={`${item.id}-line-${lineIndex}`}
                                        >
                                          {line}
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <p>
                              No retrieved source excerpt
                              is available.
                            </p>
                          )}

                          <div className="aiw-evidence-disclaimer">
                            <ShieldCheck size={15} />

                            <span>
                              These are retrieved excerpts,
                              not the complete original document.
                              Verify critical procedures against
                              approved maritime sources.
                            </span>
                          </div>

                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* =====================================
                  RIGHT SIDE: ACTION BUTTONS
              ===================================== */}

              <div className="aiw-reference-actions">

                {/* EXPAND / COLLAPSE */}

                <button
                  type="button"
                  className="aiw-reference-view-btn"
                  onClick={() =>
                    toggleSummary(reference.key)
                  }
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? `Hide details for ${reference.filename}`
                      : `View details for ${reference.filename}`
                  }
                  title={
                    expanded
                      ? "Hide Details"
                      : "View Details"
                  }
                >
                  {expanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>

                {/* ORIGINAL DOCUMENT BUTTON */}

                <button
                  type="button"
                  className="aiw-view-original-btn"
                  onClick={() =>
                    handleViewDocument(reference)
                  }
                  title="View Original Document"
                >
                  <Eye size={15} />
                  <span>View Document</span>
                </button>

              </div>
            </article>
          );
        })}
      </div>

      {/* REFERENCE DISCLAIMER */}

      <p className="aiw-reference-note">
        Retrieved excerpts and summaries are provided
        for preliminary decision support and must be
        verified against original maritime documents.
      </p>

      {/* ORIGINAL DOCUMENT MODAL */}

      {previewDocument && (
        <OriginalDocumentModal
          source={previewDocument.source}
          filename={previewDocument.filename}
          token={token}
          onClose={() => setPreviewDocument(null)}
        />
      )}

    </section>
  );
}
