import { useState } from "react";
import { queryDocument } from "../../services/documentApi";

function DocumentQuery() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!query.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnswer(null);

      const data = await queryDocument(query.trim());
      setAnswer(data);
    } catch (err) {
      setError(err.message || "Unable to process your question.");
    } finally {
      setLoading(false);
    }
  };

  const getAnswerText = () => {
    if (typeof answer === "string") {
      return answer;
    }

    return (
      answer?.answer ||
      answer?.response ||
      answer?.result ||
      JSON.stringify(answer, null, 2)
    );
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 78px)",
        padding: "48px 20px 70px",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "6px 12px",
              borderRadius: "20px",
              background: "#cffafe",
              border: "1px solid #a5f3fc",
              color: "#0e7490",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.6px",
              marginBottom: "13px",
            }}
          >
            ✦ DOCUMENT ASSISTANT
          </div>

          <h1
            style={{
              margin: 0,
              color: "#0b1f3a",
              fontSize: "36px",
              fontWeight: "800",
              letterSpacing: "-1px",
            }}
          >
            Document Q&A
          </h1>

          <p
            style={{
              color: "#64748b",
              marginTop: "9px",
              marginBottom: 0,
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            Ask questions and retrieve information from processed maritime
            documents.
          </p>
        </div>

        {/* Question Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.96)",
            padding: "30px",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 35px rgba(15, 23, 42, 0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                color: "white",
                fontSize: "19px",
              }}
            >
              ⚓
            </div>

            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#0f172a",
                }}
              >
                Ask SeaGuard AI
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  marginTop: "3px",
                }}
              >
                Search information from uploaded maritime documents
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                color: "#334155",
                marginBottom: "9px",
                fontSize: "13px",
              }}
            >
              Your Question
            </label>

            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: What incident was reported in the document?"
              rows="5"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                resize: "vertical",
                outline: "none",
                lineHeight: "1.6",
                color: "#1e293b",
                background: "#f8fafc",
                fontSize: "14px",
                transition: "0.2s",
              }}
            />

            {error && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px 15px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: "9px",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                width: "100%",
                marginTop: "18px",
                padding: "14px",
                border: "none",
                borderRadius: "10px",
                background:
                  loading || !query.trim()
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #082f49, #0369a1)",
                color: "white",
                fontWeight: "700",
                fontSize: "14px",
                cursor:
                  loading || !query.trim()
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  loading || !query.trim()
                    ? "none"
                    : "0 6px 18px rgba(3, 105, 161, 0.20)",
              }}
            >
              {loading ? "Searching Documents..." : "✦ Ask SeaGuard AI"}
            </button>
          </form>
        </div>

        {/* Answer Card */}
        {answer && (
          <div
            style={{
              marginTop: "24px",
              background: "rgba(255,255,255,0.97)",
              padding: "30px",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 35px rgba(15, 23, 42, 0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#0891b2",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.6px",
                    marginBottom: "5px",
                  }}
                >
                  SEAGUARD AI RESPONSE
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: "#0b1f3a",
                    fontSize: "22px",
                  }}
                >
                  Answer
                </h2>
              </div>

              <div
                style={{
                  padding: "7px 11px",
                  borderRadius: "20px",
                  background: "#ecfdf5",
                  color: "#047857",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                ● RESPONSE READY
              </div>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(135deg, #f8fafc, #f0f9ff)",
                border: "1px solid #dbeafe",
                borderLeft: "4px solid #0ea5e9",
                borderRadius: "12px",
                padding: "20px",
                color: "#334155",
                lineHeight: "1.8",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
              }}
            >
              {getAnswerText()}
            </div>

            <div
              style={{
                marginTop: "14px",
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              Response generated from processed maritime document data.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentQuery;