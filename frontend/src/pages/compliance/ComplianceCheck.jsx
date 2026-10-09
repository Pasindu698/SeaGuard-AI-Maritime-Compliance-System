
import { useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HelpCircle,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Ship,
  XCircle,
} from "lucide-react";

import { checkCompliance } from "../../services/complianceApi";
import "./Compliance.css";

const examples = [
  {
    title: "Fire Emergency",
    description:
      "A fire broke out in the engine room. The crew activated the fire alarm, informed the bridge, isolated the affected area, and used firefighting equipment.",
  },
  {
    title: "Vessel Collision",
    description:
      "The vessel collided with another ship. The bridge was notified, the crew checked for damage and water ingress, and the incident was recorded.",
  },
  {
    title: "Person Overboard",
    description:
      "A crew member fell overboard. The alarm was raised, the bridge was notified, a lookout was maintained, and rescue equipment was prepared.",
  },
];

function RequirementGroup({
  title,
  items = [],
  type,
  emptyMessage,
}) {
  const icons = {
    matched: CheckCircle2,
    missing: XCircle,
    unverified: HelpCircle,
  };

  const Icon = icons[type] || HelpCircle;

  return (
    <section
      className={`compliance-check-group compliance-check-${type}`}
    >
      <div className="compliance-check-group-header">
        <div className="compliance-check-group-title">
          <Icon size={20} />
          <h3>{title}</h3>
        </div>

        <span className="compliance-check-group-count">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="compliance-check-empty">
          {emptyMessage}
        </p>
      ) : (
        <ul className="compliance-requirement-list">
          {items.map((item, index) => (
            <li key={`${type}-${index}`}>
              <Icon size={17} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ComplianceCheck({ token }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assessment, setAssessment] = useState(null);

  const handleCheck = async (text = description) => {
    const cleanText = text.trim();

    if (cleanText.length < 10) {
      setAssessment(null);
      setError(
        "Please enter an incident description of at least 10 characters."
      );
      return;
    }

    setDescription(cleanText);
    setLoading(true);
    setError("");
    setAssessment(null);

    try {
      const data = await checkCompliance(
        cleanText,
        token,
        5
      );

      setAssessment(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to assess incident compliance."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDescription("");
    setError("");
    setAssessment(null);
  };

  const matched =
    assessment?.matched_requirements || [];

  const missing =
    assessment?.missing_requirements || [];

  const unverified =
    assessment?.unverified_requirements || [];

  const references =
    assessment?.references || [];

  const statusLabel = assessment?.status
    ? assessment.status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )
    : "Assessment unavailable";

  return (
    <div className="compliance-page">
      <div className="compliance-container">

        {/* HERO SECTION */}

        <div className="compliance-hero">
          <div className="compliance-hero-content">
            <span className="compliance-eyebrow">
              <Ship size={16} />
              SEAGUARD AI • COMPLIANCE AGENT
            </span>

            <h1>Maritime Compliance Assessment</h1>

            <p>
              Evaluate reported incident response actions
              against retrieved maritime emergency procedures.
              Results are preliminary and require human review.
            </p>
          </div>

          <div className="compliance-hero-icon">
            <ClipboardCheck size={42} />
          </div>
        </div>

        {/* INCIDENT INPUT */}

        <section className="compliance-search-panel">
          <div className="compliance-section-heading">
            <div className="compliance-heading-icon">
              <Activity size={21} />
            </div>

            <div>
              <h2>Incident Assessment</h2>
              <p>
                Describe what happened and the actions
                taken by the crew.
              </p>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleCheck();
            }}
          >
            <label
              className="compliance-check-label"
              htmlFor="compliance-description"
            >
              Incident Description
            </label>

            <textarea
              id="compliance-description"
              className="compliance-check-textarea"
              rows={6}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the maritime incident, actions taken, personnel involved, and any emergency response measures..."
              disabled={loading}
            />

            <div className="compliance-check-actions">
              <button
                type="submit"
                className="compliance-primary-btn"
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle
                    size={18}
                    className="compliance-spin"
                  />
                ) : (
                  <ShieldCheck size={18} />
                )}

                {loading
                  ? "Assessing Incident..."
                  : "Check Compliance"}
              </button>

              <button
                type="button"
                className="compliance-check-clear"
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw size={17} />
                Clear
              </button>
            </div>
          </form>

          {/* EXAMPLE INCIDENTS */}

          <div className="compliance-check-examples">
            <span>Try an example:</span>

            <div className="compliance-suggestion-list">
              {examples.map((example) => (
                <button
                  type="button"
                  key={example.title}
                  disabled={loading}
                  onClick={() =>
                    handleCheck(example.description)
                  }
                >
                  {example.title}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            className="compliance-error"
            role="alert"
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING STATE */}

        {loading && (
          <div className="compliance-feedback">
            <LoaderCircle
              size={30}
              className="compliance-spin"
            />

            <h3>Analyzing incident response...</h3>

            <p>
              Retrieving procedures and checking
              reported actions.
            </p>
          </div>
        )}

        {/* ASSESSMENT RESULTS */}

        {!loading && assessment && (
          <section className="compliance-assessment-results">

            <div className="compliance-results-header">
              <div>
                <span className="compliance-results-label">
                  PRELIMINARY COMPLIANCE REVIEW
                </span>

                <h2>Assessment Results</h2>

                <p>
                  Review the findings and supporting references.
                </p>
              </div>
            </div>

            {/* ASSESSMENT SUMMARY */}

            <div className="compliance-assessment-summary">
              <div className="compliance-assessment-status">
                <div className="compliance-status-icon">
                  <AlertTriangle size={25} />
                </div>

                <div>
                  <span>ASSESSMENT STATUS</span>

                  <h3>{statusLabel}</h3>

                  <p>
                    This is an automated preliminary assessment,
                    not a final compliance determination.
                  </p>
                </div>
              </div>

              <div className="compliance-assessment-stats">
                <div>
                  <strong>{matched.length}</strong>
                  <span>Matched</span>
                </div>

                <div>
                  <strong>{missing.length}</strong>
                  <span>Missing</span>
                </div>

                <div>
                  <strong>{unverified.length}</strong>
                  <span>Unverified</span>
                </div>
              </div>
            </div>

            {/* REQUIREMENT RESULTS */}

            <div className="compliance-check-grid">
              <RequirementGroup
                title="Matched Requirements"
                items={matched}
                type="matched"
                emptyMessage="No matched requirements identified."
              />

              <RequirementGroup
                title="Missing Requirements"
                items={missing}
                type="missing"
                emptyMessage="No explicitly missing requirements identified."
              />

              <RequirementGroup
                title="Unverified Requirements"
                items={unverified}
                type="unverified"
                emptyMessage="No unverified requirements reported."
              />
            </div>

            {/* SUPPORTING REFERENCES */}

            <div className="compliance-reference-section">
              <div className="compliance-section-heading">
                <div className="compliance-heading-icon">
                  <BookOpen size={21} />
                </div>

                <div>
                  <h2>Supporting References</h2>

                  <p>
                    Knowledge base documents used during
                    the preliminary assessment.
                  </p>
                </div>
              </div>

              {references.length === 0 ? (
                <div className="compliance-feedback">
                  <FileText size={28} />

                  <h3>No references available</h3>

                  <p>
                    No supporting documents were returned
                    for this assessment.
                  </p>
                </div>
              ) : (
                <div className="compliance-reference-grid">
                  {references.map((reference, index) => (
                    <article
                      className="compliance-reference-card"
                      key={`${reference.filename}-${reference.chunk_id}-${index}`}
                    >
                      <div className="compliance-reference-icon">
                        <FileText size={21} />
                      </div>

                      <div className="compliance-reference-info">
                        <span>SOURCE REFERENCE</span>

                        <h3>{reference.filename}</h3>

                        <p>{reference.source}</p>

                        <div className="compliance-reference-meta">
                          <span>
                            Chunk{" "}
                            {reference.chunk_id ?? "N/A"}
                          </span>

                          <span>
                            {reference.file_type || "Document"}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* HUMAN REVIEW WARNING */}

            <div className="compliance-assessment-warning">
              <AlertTriangle size={20} />

              <p>
                {assessment.disclaimer ||
                  "This assessment is preliminary. An authorized maritime officer must verify all findings and applicable requirements."}
              </p>
            </div>
          </section>
        )}

        {/* GENERAL DISCLAIMER */}

        <div className="compliance-disclaimer">
          <ShieldCheck size={19} />

          <p>
            SeaGuard AI assists with maritime procedure
            assessment. It does not replace official regulations,
            vessel-specific procedures, or professional judgment.
          </p>
        </div>

      </div>
    </div>
  );
}
