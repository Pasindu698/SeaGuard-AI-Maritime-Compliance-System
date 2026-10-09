import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function RoleProtectedRoute({
  allowedRoles,
  children,
}) {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
        }}
      >
        Verifying permissions...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/documents" replace />;
  }

  return children;
}

export default RoleProtectedRoute;