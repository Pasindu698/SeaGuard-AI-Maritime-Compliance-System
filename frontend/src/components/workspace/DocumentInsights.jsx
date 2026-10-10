import { FileText } from "lucide-react";

export default function DocumentInsights({ document }) {
  if (!document) return null;

  const fields = [
    ["Document", document.filename || "Unknown"],
    ["Document Type", document.document_type || "Unknown"],
    ["Detected Incident", document.incident_type || "Unknown"],
    ["Vessel", document.vessel_name || "Not identified"],
  ];

  return (
    <section className="aiw-result-section">
      <div className="aiw-section-heading">
        <FileText size={22} />
        <h3>Document Insights</h3>
      </div>

      <div className="aiw-document-meta">
        {fields.map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="aiw-document-summary">
        <h4>Extracted Summary</h4>
        <p>
          {document.summary || "No document summary available."}
        </p>
      </div>
    </section>
  );
}