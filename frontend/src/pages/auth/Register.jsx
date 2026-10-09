
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authApi";

const passwordRules = [
  {
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    label: "One number",
    test: (value) => /[0-9]/.test(value),
  },
  {
    label: "One special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
  {
    label: "No leading or trailing spaces",
    test: (value) => value === value.trim(),
  },
  {
    label: "Maximum 72 UTF-8 bytes",
    test: (value) =>
      new TextEncoder().encode(value).length <= 72,
  },
];

function EyeIcon({ visible }) {
  return visible ? (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.7 10.7 0 0112 5c5.5 0 9.5 4.5 10 7a11.8 11.8 0 01-3.1 4.8" />
      <path d="M6.3 6.3C3.8 8 2.4 10.5 2 12c.5 2.5 4.5 7 10 7a10.4 10.4 0 004.1-.8" />
      <path d="M10 10a2.8 2.8 0 004 4" />
    </svg>
  ) : (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordFocused, setPasswordFocused] =
    useState(false);

  const [requirementsOpen, setRequirementsOpen] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  };

  const passedRules = passwordRules.filter((rule) =>
    rule.test(formData.password)
  ).length;

  const passwordValid =
    formData.password.length > 0 &&
    passedRules === passwordRules.length;

  const getStrength = () => {
    if (!formData.password) {
      return {
        label: "",
        color: "#e2e8f0",
        width: "0%",
      };
    }

    if (passedRules <= 3) {
      return {
        label: "Weak password",
        color: "#ef4444",
        width: "33%",
      };
    }

    if (!passwordValid) {
      return {
        label: "Almost there",
        color: "#f59e0b",
        width: "70%",
      };
    }

    return {
      label: "Meets requirements",
      color: "#10b981",
      width: "100%",
    };
  };

  const strength = getStrength();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (
      !/^[a-zA-Z0-9_]{3,50}$/.test(
        formData.username.trim()
      )
    ) {
      setError(
        "Username must contain 3-50 letters, numbers or underscores."
      );
      return;
    }

    if (!passwordValid) {
      setRequirementsOpen(true);
      setError(
        "Please make sure your password meets all security requirements."
      );
      return;
    }

    if (
      formData.password !== formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.message || "Unable to create account."
      );
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
        padding: "40px 20px",
        background:
          "radial-gradient(circle at 80% 20%, rgba(6,182,212,0.20), transparent 30%), linear-gradient(135deg, #020617, #082f49 55%, #0c4a6e)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255,255,255,0.98)",
          borderRadius: "22px",
          padding: "38px",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.28)",
          boxSizing: "border-box",
        }}
      >
        {/* BRAND */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
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
                "linear-gradient(135deg,#0284c7,#06b6d4)",
              color: "#ffffff",
              fontSize: "28px",
              boxShadow:
                "0 10px 25px rgba(2,132,199,0.25)",
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
              fontSize: "13px",
            }}
          >
            Maritime Safety & Intelligence Platform
          </p>
        </div>

        {/* HEADING */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "21px",
            }}
          >
            Create Account
          </h2>

          <p
            style={{
              color: "#64748b",
              margin: "6px 0 0",
              fontSize: "13px",
            }}
          >
            Join SeaGuard AI to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* USERNAME */}
          <label
            htmlFor="register-username"
            style={labelStyle}
          >
            Username
          </label>

          <input
            id="register-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            autoComplete="username"
            minLength={3}
            maxLength={50}
            required
            disabled={loading}
            style={inputStyle}
          />

          {/* EMAIL */}
          <label
            htmlFor="register-email"
            style={nextLabelStyle}
          >
            Email Address
          </label>

          <input
            id="register-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            autoComplete="email"
            required
            disabled={loading}
            style={inputStyle}
          />

          {/* PASSWORD */}
          <label
            htmlFor="register-password"
            style={nextLabelStyle}
          >
            Password
          </label>

          <div
            style={{
              position: "relative",
            }}
          >
            <input
              id="register-password"
              type={
                showPassword ? "text" : "password"
              }
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => {
                setPasswordFocused(true);
                setRequirementsOpen(true);
              }}
              onBlur={() => {
                setPasswordFocused(false);
                setRequirementsOpen(false);
              }}
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
              disabled={loading}
              aria-describedby="password-help"
              style={{
                ...inputStyle,
                paddingRight: "50px",
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              disabled={loading}
              style={eyeButtonStyle}
            >
              <EyeIcon visible={showPassword} />
            </button>

            {/* PASSWORD REQUIREMENTS POPOVER */}
            {requirementsOpen && passwordFocused && (
              <div
                id="password-help"
                style={{
                  position: "absolute",
                  top: "calc(100% + 9px)",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: "#ffffff",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "17px",
                  boxShadow:
                    "0 16px 40px rgba(15,23,42,0.18)",
                }}
              >
                <div
                  style={{
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: "700",
                    marginBottom: "12px",
                  }}
                >
                  Create a secure password
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "9px",
                  }}
                >
                  {passwordRules.map((rule) => {
                    const passed = rule.test(
                      formData.password
                    );

                    return (
                      <div
                        key={rule.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                          fontSize: "12px",
                          color: passed
                            ? "#059669"
                            : "#64748b",
                        }}
                      >
                        <span
                          style={{
                            width: "17px",
                            height: "17px",
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: passed
                              ? "#d1fae5"
                              : "#f1f5f9",
                            fontWeight: "800",
                            flexShrink: 0,
                          }}
                        >
                          {passed ? "✓" : "·"}
                        </span>
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PASSWORD STRENGTH */}
          {formData.password && (
            <div
              style={{
                marginTop: "10px",
              }}
            >
              <div
                style={{
                  height: "5px",
                  background: "#e2e8f0",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: strength.width,
                    height: "100%",
                    background: strength.color,
                    borderRadius: "10px",
                    transition: "all 0.25s ease",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: strength.color,
                  marginTop: "6px",
                  fontWeight: "600",
                }}
              >
                {strength.label}
              </div>
            </div>
          )}

          {/* CONFIRM PASSWORD */}
          <label
            htmlFor="register-confirm-password"
            style={nextLabelStyle}
          >
            Confirm Password
          </label>

          <div
            style={{
              position: "relative",
            }}
          >
            <input
              id="register-confirm-password"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              disabled={loading}
              style={{
                ...inputStyle,
                paddingRight: "50px",
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (previous) => !previous
                )
              }
              aria-label={
                showConfirmPassword
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
              disabled={loading}
              style={eyeButtonStyle}
            >
              <EyeIcon
                visible={showConfirmPassword}
              />
            </button>
          </div>

          {/* MATCH FEEDBACK */}
          {formData.confirmPassword && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                marginTop: "8px",
                color:
                  formData.password ===
                  formData.confirmPassword
                    ? "#059669"
                    : "#dc2626",
              }}
            >
              {formData.password ===
              formData.confirmPassword
                ? "✓ Passwords match"
                : "Passwords do not match"}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              style={{
                marginTop: "18px",
                padding: "13px 15px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "10px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div
              role="status"
              style={{
                marginTop: "18px",
                padding: "13px 15px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#047857",
                borderRadius: "10px",
                fontSize: "13px",
              }}
            >
              ✓ {success}
            </div>
          )}

          {/* SUBMIT */}
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
                : "linear-gradient(135deg,#075985,#0284c7)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              boxShadow: loading
                ? "none"
                : "0 8px 20px rgba(2,132,199,0.22)",
            }}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        {/* LOGIN */}
        <div
          style={{
            marginTop: "23px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#0284c7",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Sign In
          </Link>
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "25px",
            paddingTop: "18px",
            borderTop: "1px solid #e2e8f0",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "11px",
          }}
        >
          🔒 Secured by SeaGuard Security & Access Agent
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

const nextLabelStyle = {
  ...labelStyle,
  marginTop: "17px",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#0f172a",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
};

const eyeButtonStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  color: "#64748b",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px",
};

export default Register;
