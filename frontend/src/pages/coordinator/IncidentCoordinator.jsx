
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  FileText,
  LoaderCircle,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  Zap,
} from "lucide-react";

import { coordinateIncident } from "../../services/coordinatorApi";
import "./IncidentCoordinator.css";
import { useAuth } from "../../context/AuthContext";

const examples = [
  {
    label: "Fire Emergency",
    description:
      "A fire has broken out in the engine room of a cargo vessel. Smoke is spreading, and crew members require immediate assistance.",
  },
  {
    label: "Person Overboard",
    description:
      "A crew member has fallen overboard during rough weather. The vessel is maneuvering to initiate a rescue operation.",
  },
  {
    label: "Security Incident",
    description:
      "An unauthorized individual was detected entering a restricted area of the vessel. The security officer has been notified.",
  },
  {
    label: "Vessel Collision",
    description:
      "Two vessels have collided near a busy shipping lane. Structural damage has been reported, and the crew is assessing injuries.",
  },
];

function getRiskStyle(level) {
  const value = String(level || "").toUpperCase();

  if (value.includes("HIGH") || value.includes("CRITICAL")) {
    return "high";
  }

  if (value.includes("MEDIUM") || value.includes("MODERATE")) {
    return "medium";
  }

  if (value.includes("LOW")) {
    return "low";
  }

  return "unknown";
}

function ResultList({
  items,
  emptyMessage,
  type = "normal",
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <p className="ic-empty-list">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={`ic-result-list ic-list-${type}`}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>
          <span className="ic-list-marker">
            {type === "missing" ? "!" : index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function IncidentCoordinator() {
    const { token } = useAuth();
  const [description, setDescription] = useState("");
  const [limit, setLimit] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const riskStyle = getRiskStyle(result?.risk_level);

  const handleAnalyze = async (event) => {
    event.preventDefault();

    const cleanedDescription = description.trim();

    if (
      cleanedDescription.length < 10 ||
      cleanedDescription.length > 5000
    ) {
      setError(
        "Incident description must contain between 10 and 5000 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

     const data = await coordinateIncident(
  cleanedDescription,
  Number(limit),
  token
);

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to coordinate the incident. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDescription("");
    setLimit(5);
    setResult(null);
    setError("");
  };

  return (
    <div className="ic-page">
      <div className="ic-container">
        {/* PAGE HEADER */}
        <div className="ic-topbar">
          <Link to="/dashboard" className="ic-back-link">
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          <span className="ic-module-label">
            <Ship size={15} />
            SeaGuard AI / Coordinator Agent
          </span>
        </div>

        {/* HERO */}
        <section className="ic-hero">
          <div className="ic-hero-glow" />

          <div className="ic-hero-content">
            <div className="ic-eyebrow">
              <Zap size={15} />
              INTELLIGENT INCIDENT RESPONSE
            </div>

            <h1>
              Maritime Incident
              <span> Coordinator</span>
            </h1>

            <p>
              Describe a maritime emergency or security
              incident. SeaGuard AI will coordinate incident
              assessment, compliance information, recommended
              actions, and escalation guidance.
            </p>

            <div className="ic-hero-tags">
              <span>
                <Activity size={14} />
                Risk Assessment
              </span>

              <span>
                <ShieldCheck size={14} />
                Compliance Review
              </span>

              <span>
                <Sparkles size={14} />
                AI-Assisted Response
              </span>
            </div>
          </div>

          <div className="ic-hero-symbol">
            <div className="ic-symbol-ring">
              <Ship size={65} strokeWidth={1.4} />
            </div>
          </div>
        </section>

        {/* INPUT AND QUICK SCENARIOS */}
        <div className="ic-workspace">
          <section className="ic-panel ic-input-panel">
            <div className="ic-panel-heading">
              <div className="ic-heading-icon">
                <ClipboardList size={21} />
              </div>

              <div>
                <h2>Incident Details</h2>
                <p>
                  Provide information about the situation
                  for AI-assisted assessment.
                </p>
              </div>
            </div>

            <form onSubmit={handleAnalyze}>
              <label
                htmlFor="ic-description"
                className="ic-field-label"
              >
                Incident Description
                <span className="ic-required">*</span>
              </label>

              <textarea
                id="ic-description"
                className="ic-textarea"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  if (error) setError("");
                }}
                placeholder="Example: A fire has broken out in the engine room of a cargo vessel. Smoke is spreading and the crew requires immediate assistance..."
                rows={7}
                maxLength={5000}
                disabled={loading}
                required
              />

              <div className="ic-input-meta">
                <span>Minimum 10 characters</span>
                <span>{description.length} / 5000</span>
              </div>

              <div className="ic-field-row">
                <div className="ic-limit-field">
                  <label
                    htmlFor="ic-limit"
                    className="ic-field-label"
                  >
                    Reference Retrieval Limit
                  </label>

                  <div className="ic-select-wrapper">
                    <select
                      id="ic-limit"
                      value={limit}
                      onChange={(event) =>
                        setLimit(Number(event.target.value))
                      }
                      disabled={loading}
                    >
                      {[
                        1, 2, 3, 4, 5,
                        6, 7, 8, 9, 10,
                      ].map((value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value} references
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="ic-error" role="alert">
                  <CircleAlert size={19} />
                  <span>{error}</span>
                </div>
              )}

              <div className="ic-form-actions">
                <button
                  type="submit"
                  className="ic-analyze-button"
                  disabled={
                    loading ||
                    description.trim().length < 10
                  }
                >
                  {loading ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="ic-spinner"
                      />
                      Coordinating Incident...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Analyze & Coordinate
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="ic-reset-button"
                  onClick={handleReset}
                  disabled={loading}
                >
                  <RotateCcw size={17} />
                  Reset
                </button>
              </div>
            </form>
          </section>

          {/* QUICK INCIDENT EXAMPLES */}
          <aside className="ic-panel ic-examples-panel">
            <div className="ic-panel-heading">
              <div className="ic-heading-icon">
                <Sparkles size={21} />
              </div>

              <div>
                <h2>Quick Scenarios</h2>
                <p>
                  Select a sample incident to get started.
                </p>
              </div>
            </div>

            <div className="ic-examples">
              {examples.map((example, index) => (
                <button
                  type="button"
                  key={example.label}
                  className="ic-example-button"
                  disabled={loading}
                  onClick={() => {
                    setDescription(example.description);
                    setError("");
                    setResult(null);
                  }}
                >
                  <span className="ic-example-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span>{example.label}</span>

                  <ArrowRight size={16} />
                </button>
              ))}
            </div>

            <div className="ic-advisory">
              <ShieldAlert size={21} />
              <div>
                <strong>Safety Reminder</strong>
                <p>
                  In a real emergency, follow the vessel's
                  approved procedures and immediately contact
                  the responsible officer. Do not wait for
                  AI analysis.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="ic-processing" role="status">
            <LoaderCircle
              size={30}
              className="ic-spinner"
            />
            <div>
              <strong>
                Coordinating maritime incident
              </strong>
              <p>
                Waiting for the Coordinator Agent response...
              </p>
            </div>
          </div>
        )}

        {/* ANALYSIS RESULTS */}
        {result && (
          <section className="ic-results" aria-live="polite">
            <div className="ic-results-heading">
              <div>
                <span className="ic-section-kicker">
                  COORDINATOR AGENT OUTPUT
                </span>

                <h2>Incident Assessment Results</h2>
                <p>
                  Results returned by the SeaGuard AI
                  Coordinator Agent.
                </p>
              </div>

              {result.coordination_id && (
                <div className="ic-result-id">
                  ID: {result.coordination_id}
                </div>
              )}
            </div>

            {/* SUMMARY CARDS */}
            <div className="ic-summary-grid">
              <div className="ic-summary-card">
                <div className="ic-summary-icon">
                  <Ship size={24} />
                </div>

                <span>INCIDENT TYPE</span>
                <strong>
                  {result.incident_type ||
                    "Not specified"}
                </strong>
              </div>

              <div
                className={`ic-summary-card ic-risk-${riskStyle}`}
              >
                <div className="ic-summary-icon">
                  <AlertTriangle size={24} />
                </div>

                <span>RISK LEVEL</span>
                <strong>
                  {result.risk_level || "Unknown"}
                </strong>
              </div>

              <div className="ic-summary-card">
                <div className="ic-summary-icon">
                  <ShieldCheck size={24} />
                </div>

                <span>COMPLIANCE STATUS</span>
                <strong>
                  {result.compliance_status ||
                    "Not available"}
                </strong>
              </div>
            </div>

            {/* ESCALATION */}
            <div
              className={`ic-escalation ${
                result.escalation_required
                  ? "ic-escalation-required"
                  : "ic-escalation-normal"
              }`}
            >
              {result.escalation_required ? (
                <ShieldAlert size={26} />
              ) : (
                <CheckCircle2 size={26} />
              )}

              <div>
                <h3>
                  {result.escalation_required
                    ? "Human Escalation Required"
                    : "No Escalation Flag Returned"}
                </h3>

                <p>
                  {result.escalation_message ||
                    "No additional escalation message was provided."}
                </p>
              </div>
            </div>

            {/* TWO-COLUMN DETAIL GRID */}
            <div className="ic-detail-grid">
              {/* RECOMMENDED ACTIONS */}
              <article className="ic-panel ic-result-panel">
                <div className="ic-panel-heading">
                  <div className="ic-heading-icon">
                    <ClipboardList size={21} />
                  </div>

                  <div>
                    <h2>Recommended Actions</h2>
                    <p>
                      Coordinator-generated guidance
                    </p>
                  </div>
                </div>

                <ResultList
                  items={result.recommended_actions}
                  emptyMessage="No recommended actions were returned."
                />
              </article>

              {/* COMPLIANCE ASSESSMENT */}
              <article className="ic-panel ic-result-panel">
                <div className="ic-panel-heading">
                  <div className="ic-heading-icon">
                    <ShieldCheck size={21} />
                  </div>

                  <div>
                    <h2>Compliance Assessment</h2>
                    <p>
                      Matched, missing, and unverified
                      requirements
                    </p>
                  </div>
                </div>

                {/* MATCHED REQUIREMENTS */}
                <h3 className="ic-list-title ic-matched-title">
                  <CheckCircle2 size={17} />
                  Matched Requirements
                </h3>

                <ResultList
                  items={result.matched_requirements}
                  emptyMessage="No matched requirements returned."
                  type="matched"
                />

                {/* MISSING REQUIREMENTS */}
                <h3 className="ic-list-title ic-missing-title">
                  <AlertTriangle size={17} />
                  Missing Requirements
                </h3>

                <ResultList
                  items={result.missing_requirements}
                  emptyMessage="No explicitly missing requirements returned."
                  type="missing"
                />

                {/* NOT YET VERIFIED - INSIDE CARD */}
                <h3
                  className="ic-list-title ic-unverified-title"
                  style={{ marginTop: "22px" }}
                >
                  <CircleAlert size={17} />
                  Not Yet Verified
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    marginBottom: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  These requirements could not be confirmed
                  from the incident description. Human
                  verification may be required.
                </p>

                <ResultList
                  items={result.unverified_requirements}
                  emptyMessage="No unverified requirements returned."
                  type="unverified"
                />
              </article>
            </div>

            {/* RETRIEVED REFERENCES */}
            <article className="ic-panel ic-references-panel">
              <div className="ic-panel-heading">
                <div className="ic-heading-icon">
                  <BookOpen size={21} />
                </div>

                <div>
                  <h2>Retrieved References</h2>
                  <p>
                    Supporting sources returned by the
                    retrieval process
                  </p>
                </div>
              </div>

              {Array.isArray(result.references) &&
              result.references.length > 0 ? (
                <div className="ic-reference-grid">
                  {result.references.map(
                    (reference, index) => (
                      <div
                        className="ic-reference-card"
                        key={`${reference.filename}-${index}`}
                      >
                        <div className="ic-reference-top">
                          <FileText size={22} />
                          <span>
                            Reference {index + 1}
                          </span>
                        </div>

                        <h3>{reference.filename}</h3>

                        <div className="ic-reference-meta">
                          <p>
                            <strong>Source:</strong>{" "}
                            {reference.source}
                          </p>

                          <p>
                            <strong>File Type:</strong>{" "}
                            {reference.file_type}
                          </p>

                          {reference.detected_incident && (
                            <p>
                              <strong>
                                Detected Incident:
                              </strong>{" "}
                              {reference.detected_incident}
                            </p>
                          )}

                          <p>
                            <strong>
                              Hybrid Score:
                            </strong>{" "}
                            {Number(
                              reference.hybrid_score
                            ).toFixed(3)}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="ic-empty-list">
                  No supporting references were returned.
                </p>
              )}
            </article>

            {/* FINAL COORDINATED RESPONSE */}
            <article className="ic-final-response">
              <div className="ic-final-heading">
                <div className="ic-final-icon">
                  <Sparkles size={25} />
                </div>

                <div>
                  <span>SEAGUARD AI</span>
                  <h2>Final Coordinated Response</h2>
                </div>
              </div>

              <div
  className="ic-final-text"
  style={{ whiteSpace: "pre-line", lineHeight: 1.9 }}
>
  {result.final_response ||
    "No final response was returned."}
</div>

              {result.disclaimer && (
                <div className="ic-disclaimer">
                  <CircleAlert size={18} />
                  <span>{result.disclaimer}</span>
                </div>
              )}
            </article>
          </section>
        )}

        {/* EMPTY RESULTS STATE */}
        {!result && !loading && (
          <section className="ic-empty-state">
            <div className="ic-empty-icon">
              <Activity size={32} />
            </div>

            <h2>Ready for Incident Analysis</h2>
            <p>
              Enter an incident description or choose a
              quick scenario, then select Analyze & Coordinate
              to generate an assessment.
            </p>

            <div className="ic-empty-caption">
              <Send size={15} />
              SeaGuard Coordinator API is required
              for incident analysis
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
