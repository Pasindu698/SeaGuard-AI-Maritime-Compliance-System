
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim() || !formData.password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login(
        formData.username.trim(),
        formData.password
      );

      navigate("/documents", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px",
        background:
          "radial-gradient(circle at 20% 20%, rgba(14,165,233,0.20), transparent 30%), linear-gradient(135deg, #020617, #082f49 55%, #0c4a6e)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          boxSizing: "border-box",
          background: "rgba(255,255,255,0.98)",
          borderRadius: "22px",
          padding: "38px",
          boxShadow: "0 25px 70px rgba(0,0,0,0.28)",
        }}
      >
        {/* BRAND */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              margin: "0 auto 15px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, #0284c7, #06b6d4)",
              color: "white",
              fontSize: "28px",
              boxShadow: "0 10px 25px rgba(2,132,199,0.25)",
            }}
          >
            ⚓
          </div>

          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "28px",
            }}
          >
            SeaGuard{" "}
            <span style={{ color: "#0284c7" }}>
              AI
            </span>
          </h1>

          <p
            style={{
              color: "#64748b",
              margin: "8px 0 0",
              fontSize: "14px",
            }}
          >
            Secure Maritime Intelligence Platform
          </p>
        </div>

        {/* WELCOME */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "21px",
            }}
          >
            Welcome Back
          </h2>

          <p
            style={{
              color: "#64748b",
              margin: "6px 0 0",
              fontSize: "13px",
            }}
          >
            Sign in to access the SeaGuard AI system.
          </p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="login-username"
            style={labelStyle}
          >
            Username
          </label>

          <input
            id="login-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            autoComplete="username"
            disabled={loading}
            required
            style={inputStyle}
          />

          <label
            htmlFor="login-password"
            style={{
              ...labelStyle,
              marginTop: "18px",
            }}
          >
            Password
          </label>

          <input
            id="login-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
            required
            style={inputStyle}
          />

          {/* FORGOT PASSWORD */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "12px",
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                color: "#0284c7",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Forgot Password?
            </Link>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div
              role="alert"
              style={{
                marginTop: "16px",
                padding: "12px 14px",
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

          {/* SIGN IN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #075985, #0284c7)",
              color: "white",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading
                ? "none"
                : "0 8px 20px rgba(2,132,199,0.22)",
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* REGISTER LINK */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#0284c7",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Create Account
          </Link>
        </div>

        {/* SECURITY FOOTER */}
        <div
          style={{
            marginTop: "26px",
            paddingTop: "18px",
            borderTop: "1px solid #e2e8f0",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "11px",
          }}
        >
          🔒 Protected by SeaGuard Security & Access Agent
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#334155",
  fontWeight: "600",
  fontSize: "13px",
};

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#0f172a",
  outline: "none",
  fontSize: "14px",
};

export default Login;
