
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

import {
  findSupportingSources,
} from "../../utils/sourceCitations";

function RequirementGroup({
  title,
  items,
  type,
  Icon,
  sourceGroups,
  onSourceClick,
}) {
  if (!items.length) return null;

  const defaultExpanded =
    type === "missing" || type === "unverified";

  return (
    <details
      className={`aiw-requirement-group aiw-requirement-${type}`}
      ref={(element) => {
        if (element && !element.dataset.initialized) {
          element.open = defaultExpanded;
          element.dataset.initialized = "true";
        }
      }}
    >
      <summary>
        <span className="aiw-requirement-heading">
          <Icon size={18} />
          {title}
        </span>

        <span className="aiw-requirement-count">
          {items.length}
        </span>
      </summary>

      <ul className="aiw-requirement-list">
        {items.map((item, index) => {
          const requirement =
            typeof item === "string"
              ? item
              : JSON.stringify(item);

          const supportingSources = findSupportingSources(
            requirement,
            sourceGroups
          );

          return (
            <li key={`${type}-${index}`}>
              <Icon size={17} />

              <div className="aiw-requirement-body">
                <span>{requirement}</span>

                {supportingSources.length > 0 && (
                  <div className="aiw-citation-links">
                    {supportingSources.map((source) => (
                      <button
                        type="button"
                        key={source.key}
                        className="aiw-citation-btn"
                        onClick={() =>
                          onSourceClick(source)
                        }
                        title={`View evidence from ${source.filename}`}
                        aria-label={`View source ${source.citationId}: ${source.filename}`}
                      >
                        <BookOpen size={13} />
                        {source.citationId}
                        <ExternalLink size={12} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export default function ComplianceResults({
  result,
  sourceGroups = [],
  onSourceClick = () => {},
}) {
  const matched = Array.isArray(result.matched_requirements)
    ? result.matched_requirements
    : [];

  const missing = Array.isArray(result.missing_requirements)
    ? result.missing_requirements
    : [];

  const unverified = Array.isArray(
    result.unverified_requirements
  )
    ? result.unverified_requirements
    : [];

  return (
    <section className="aiw-result-section">
      <div className="aiw-section-heading">
        <BookOpen size={22} />
        <h3>Maritime Compliance Assessment</h3>
      </div>

      <p className="aiw-section-description">
        Preliminary assessment based on retrieved maritime
        documents and procedures.
      </p>

      <div className="aiw-compliance-stats">
        <div className="aiw-stat-matched">
          <strong>{matched.length}</strong>
          <span>Matched Requirements</span>
        </div>

        <div className="aiw-stat-missing">
          <strong>{missing.length}</strong>
          <span>Missing Requirements</span>
        </div>

        <div className="aiw-stat-unverified">
          <strong>{unverified.length}</strong>
          <span>Unverified Requirements</span>
        </div>
      </div>

      <RequirementGroup
        title="Matched Requirements"
        items={matched}
        type="matched"
        Icon={CheckCircle2}
        sourceGroups={sourceGroups}
        onSourceClick={onSourceClick}
      />

      <RequirementGroup
        title="Missing Requirements"
        items={missing}
        type="missing"
        Icon={XCircle}
        sourceGroups={sourceGroups}
        onSourceClick={onSourceClick}
      />

      <RequirementGroup
        title="Unverified Requirements"
        items={unverified}
        type="unverified"
        Icon={HelpCircle}
        sourceGroups={sourceGroups}
        onSourceClick={onSourceClick}
      />

      {!matched.length &&
        !missing.length &&
        !unverified.length && (
          <p className="aiw-empty-message">
            No detailed compliance requirements were returned.
          </p>
        )}

      <div className="aiw-compliance-notice">
        <AlertTriangle size={18} />

        <span>
          This is a preliminary AI-assisted assessment,
          not a verified regulatory compliance determination.
          An empty missing or unverified list does not
          establish full compliance.
        </span>
      </div>
    </section>
  );
}
