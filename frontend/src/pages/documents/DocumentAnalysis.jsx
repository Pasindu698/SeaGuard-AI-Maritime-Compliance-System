import { useState } from "react";
import UploadBox from "../../components/documents/UploadBox";
import { uploadDocument } from "../../services/documentApi";
import AnalysisResult from "../../components/documents/AnalysisResult";

function DocumentAnalysis() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await uploadDocument(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.message || "Unable to analyze the document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 11px",
            borderRadius: "20px",
            background: "#e0f2fe",
            color: "#0369a1",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.4px",
            marginBottom: "12px",
          }}
        >
          ⚓ DOCUMENT INTELLIGENCE
        </div>

        <h1
          style={{
            margin: 0,
            color: "#0b1f3a",
            fontSize: "34px",
            fontWeight: "800",
            letterSpacing: "-0.8px",
          }}
        >
          Maritime Document Analysis
        </h1>

        <p
          style={{
            color: "#64748b",
            marginTop: "9px",
            fontSize: "15px",
          }}
        >
          Upload vessel and incident documents for secure AI-powered analysis.
        </p>
    </div>

        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <UploadBox
            selectedFile={selectedFile}
            onFileSelect={(file) => {
              setSelectedFile(file);
              setResult(null);
              setError("");
            }}
            disabled={loading}
          />

          {error && (
            <div
              style={{
                marginTop: "18px",
                padding: "12px 16px",
                background: "#fee2e2",
                borderRadius: "8px",
                color: "#991b1b",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            style={{
              width: "100%",
              marginTop: "22px",
              padding: "14px",
              border: "none",
              borderRadius: "9px",
              background:
                !selectedFile || loading ? "#94a3b8" : "#0f172a",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor:
                !selectedFile || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Analyzing Document..." : "Analyze Document"}
          </button>
        </div>

        <AnalysisResult result={result} />
      </div>
    </div>
  );
}

export default DocumentAnalysis;