
import { useEffect, useMemo, useState } from "react";

import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  BookOpen,
  Flame,
  ChevronDown,
} from "lucide-react";

import DocumentInsights from "./DocumentInsights";
import ComplianceResults from "./ComplianceResults";
import ReferencesPanel from "./ReferencesPanel";
import Recommendations from "./Recommendations";
import FinalResponse from "./FinalResponse";

import {
  buildSourceGroups,
} from "../../utils/sourceCitations";

// ========================================
// FORMAT STATUS
// ========================================

function formatStatus(value) {
  if (!value) return "Not assessed";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

// ========================================
// ASSESSMENT RESULTS COMPONENT
// ========================================

export default function AssessmentResults({
  result,
  token,
}) {
  // ========================================
  // SOURCE CITATION STATE
  // ========================================

  const [activeSourceKey, setActiveSourceKey] =
    useState(null);

  const [citationRequest, setCitationRequest] =
    useState(0);

  // ========================================
  // BUILD SOURCE GROUPS
  // ========================================

  const sourceGroups = useMemo(
    () => buildSourceGroups(result?.references || []),
    [result?.references]
  );

  // ========================================
  // RESET SOURCE SELECTION
  // ========================================

  useEffect(() => {
    setActiveSourceKey(null);
  }, [result]);

  // ========================================
  // HANDLE SOURCE CITATION CLICK
  // ========================================

  const handleSourceClick = (source) => {
    if (!source?.key) return;

    setActiveSourceKey(source.key);

    // Increment on every click so clicking
    // the same citation again still works.
    setCitationRequest((previous) => previous + 1);
  };

  // ========================================
  // EMPTY ASSESSMENT STATE
  // ========================================

  if (!result) {
    return (
      <section className="aiw-results-placeholder">
        <BrainCircuit size={34} />

        <h2>Unified Assessment Results</h2>

        <p>
          Document insights, risk assessment,
          compliance findings, references and
          coordinated recommendations will appear here.
        </p>
      </section>
    );
  }

  // ========================================
  // RISK LEVEL
  // ========================================

  const riskLevel = String(
    result.risk_level || "UNKNOWN"
  ).toUpperCase();

  const highRisk =
    riskLevel === "HIGH" ||
    riskLevel === "CRITICAL";

  // ========================================
  // RECOMMENDED ACTIONS
  // ========================================

  const actions =
    result.recommended_actions ??
    result.recommendations ??
    [];

  // ========================================
  // COMPONENT UI
  // ========================================

  return (
    <section className="aiw-card aiw-result-card">

      {/* =====================================
          RESULTS HEADER
      ===================================== */}

      <div className="aiw-results-header">
        <div className="aiw-heading">
          <CheckCircle2 size={26} />

          <div>
            <h2>Unified Assessment Results</h2>

            <p>
              Coordinated multi-agent assessment generated.
            </p>
          </div>
        </div>

        <span className="aiw-completed-label">
          <CheckCircle2 size={15} />
          Assessment Generated
        </span>
      </div>

      {/* =====================================
          ASSESSMENT OVERVIEW
      ===================================== */}

      <div className="aiw-result-grid">

        {/* INCIDENT TYPE */}

        <div>
          <small>Incident Type</small>

          <strong>
            <Flame size={19} />
            {formatStatus(result.incident_type)}
          </strong>
        </div>

        {/* RISK LEVEL */}

        <div>
          <small>Risk Level</small>

          <strong
            className={
              highRisk ? "aiw-danger-text" : ""
            }
          >
            <AlertTriangle size={19} />
            {riskLevel}
          </strong>
        </div>

        {/* COMPLIANCE STATUS */}

        <div>
          <small>Compliance Status</small>

          <strong>
            <BookOpen size={19} />
            {formatStatus(result.compliance_status)}
          </strong>
        </div>

        {/* HUMAN ESCALATION */}

        <div>
          <small>Human Escalation</small>

          <strong
            className={
              result.escalation_required
                ? "aiw-danger-text"
                : ""
            }
          >
            <ShieldCheck size={19} />

            {result.escalation_required === true
              ? "Required"
              : result.escalation_required === false
                ? "Not Required"
                : "Not Assessed"}
          </strong>
        </div>
      </div>

      {/* =====================================
          HUMAN ESCALATION ALERT
      ===================================== */}

      {result.escalation_required && (
        <div className="aiw-escalation-card">
          <div className="aiw-section-heading">
            <AlertTriangle size={22} />

            <h3>Human Escalation Required</h3>
          </div>

          <p>
            {result.escalation_message ||
              "Responsible maritime personnel should review this incident immediately."}
          </p>
        </div>
      )}

      {/* =====================================
          DOCUMENT INSIGHTS
      ===================================== */}

      <DocumentInsights
        document={result.document}
      />

      {/* =====================================
          COMPLIANCE RESULTS
          + CLICKABLE SOURCE CITATIONS
      ===================================== */}

      <ComplianceResults
        result={result}
        sourceGroups={sourceGroups}
        onSourceClick={handleSourceClick}
      />

      {/* =====================================
          MARITIME REFERENCES
          + SOURCE SUMMARIES
          + SOURCE EVIDENCE
          + ORIGINAL DOCUMENT PREVIEW
      ===================================== */}

      <ReferencesPanel
        references={result.references || []}
        sourceGroups={sourceGroups}
        activeSourceKey={activeSourceKey}
        citationRequest={citationRequest}
        token={token}
      />

      {/* =====================================
          RECOMMENDATIONS
      ===================================== */}

      <Recommendations
        actions={actions}
      />

      {/* =====================================
          FINAL COORDINATED RESPONSE
      ===================================== */}

      <FinalResponse
        finalResponse={result.final_response}
        disclaimer={result.disclaimer}
      />

      {/* =====================================
          COMPLETE AGENT RESPONSE
      ===================================== */}

      <details className="aiw-raw-response">
        <summary>
          <span>
            <ChevronDown size={18} />
            View Complete Agent Response
          </span>
        </summary>

        <pre className="aiw-json">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>

    </section>
  );
}
