import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          color: "#0f172a",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "34px",
              marginBottom: "12px",
            }}
          >
            ⚓
          </div>

          <div
            style={{
              fontWeight: "700",
              fontSize: "16px",
            }}
          >
            SeaGuard AI
          </div>

          <div
            style={{
              color: "#64748b",
              marginTop: "6px",
              fontSize: "13px",
            }}
          >
            Verifying secure access...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;