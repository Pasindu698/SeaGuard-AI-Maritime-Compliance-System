import { ClipboardList } from "lucide-react";

export default function Recommendations({ actions }) {
  const items = Array.isArray(actions) ? actions : [];

  return (
    <section className="aiw-result-section">
      <div className="aiw-section-heading">
        <ClipboardList size={22} />
        <h3>Recommended Actions</h3>
      </div>

      {items.length > 0 ? (
        <ol className="aiw-action-list">
          {items.map((action, index) => (
            <li key={index}>
              <span className="aiw-action-number">
                {index + 1}
              </span>

              <p>
                {typeof action === "string"
                  ? action
                  : JSON.stringify(action)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="aiw-empty-message">
          No specific recommended actions were returned
          by the Coordinator Agent.
        </p>
      )}
    </section>
  );
}