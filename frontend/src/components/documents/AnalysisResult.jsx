function AnalysisResult({ result }) {
  if (!result) return null;

  const incident =
    result.incident_type && result.incident_type !== "unknown"
      ? result.incident_type
      : "Not Detected";

  return (
    <div
      style={{
        marginTop: "25px",
        background: "white",
        padding: "28px",
        borderRadius: "18px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "25px",
          }}
        >
          Analysis Result
        </h2>

        <p
          style={{
            color: "#64748b",
            marginTop: "6px",
          }}
        >
          Document successfully processed by SeaGuard AI.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <InfoCard
          title="File Name"
          value={result.filename || "Not available"}
        />

        <InfoCard
          title="Document Type"
          value={result.document_type || "Not available"}
        />

        <InfoCard
          title="Vessel Name"
          value={result.vessel_name || "Not detected"}
        />

        <InfoCard
          title="Incident Type"
          value={incident.toUpperCase()}
        />
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#f8fafc",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: "10px",
            color: "#0f172a",
          }}
        >
          Document Summary
        </h3>

        <p
          style={{
            margin: 0,
            lineHeight: "1.7",
            color: "#475569",
            whiteSpace: "pre-wrap",
          }}
        >
          {result.summary || "No summary available."}
        </p>
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        <span>
          Text Length: <strong>{result.text_length ?? 0}</strong> characters
        </span>

        <span>
          Document ID: <strong>{result.document_id || "N/A"}</strong>
        </span>
      </div>
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div
      style={{
        padding: "18px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#64748b",
          marginBottom: "7px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#0f172a",
          fontWeight: "700",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default AnalysisResult;