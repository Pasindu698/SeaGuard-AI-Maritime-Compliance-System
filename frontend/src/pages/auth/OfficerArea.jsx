import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getOfficerArea } from "../../services/authApi";

function OfficerArea() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOfficerArea = async () => {
      try {
        const data = await getOfficerArea();

        setMessage(
          data?.message ||
            "Officer authorization verified successfully."
        );
      } catch (err) {
        setError(
          err.message ||
            "You do not have permission to access the Officer Area."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOfficerArea();
  }, []);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 140px)",
        background: "#f1f5f9",
        padding: "45px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "20px",
            background: "#cffafe",
            color: "#0e7490",
            fontSize: "11px",
            fontWeight: "700",
            marginBottom: "14px",
          }}
        >
          ⚓ SECURE OFFICER ACCESS
        </div>

        <h1
          style={{
            margin: 0,
            color: "#0b1f3a",
            fontSize: "34px",
          }}
        >
          Officer Area
        </h1>

        <p
          style={{
            color: "#64748b",
            marginTop: "8px",
          }}
        >
          Role-protected maritime operations area for authorized officers.
        </p>

        <div
          style={{
            marginTop: "28px",
            background: "white",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 5px 25px rgba(15,23,42,0.07)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0f172a",
            }}
          >
            Access Information
          </h2>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px",
              lineHeight: "1.8",
            }}
          >
            <div>
              <strong>User:</strong> {user?.username}
            </div>

            <div>
              <strong>Role:</strong>{" "}
              <span
                style={{
                  color: "#0284c7",
                  textTransform: "uppercase",
                  fontWeight: "700",
                }}
              >
                {user?.role}
              </span>
            </div>
          </div>

          {loading && (
            <p style={{ color: "#64748b" }}>
              Verifying officer permissions...
            </p>
          )}

          {message && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "10px",
                background: "#ecfdf5",
                color: "#047857",
              }}
            >
              ✓ {message}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "10px",
                background: "#fef2f2",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfficerArea;