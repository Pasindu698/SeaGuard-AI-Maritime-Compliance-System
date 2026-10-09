
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const initials = (user?.username || "U")
    .slice(0, 2)
    .toUpperCase();

  const role = user?.role || "crew";

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    outlineColor: "#0891b2",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "8px",
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password) &&
      password === password.trim() &&
      new TextEncoder().encode(password).length <= 72
    );
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(
        "New password must contain at least 8 characters, " +
        "uppercase, lowercase, number and special character, " +
        "and must not exceed 72 UTF-8 bytes."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("seaguard_token");

      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to change password. Please try again."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        "Password changed successfully. Redirecting to login..."
      );

      // Existing JWT is invalidated by the backend.
      // Clear the local session and return to login.
      logout();
      navigate("/login", { replace: true });

    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 140px)",
        background: "#f1f5f9",
        padding: "45px 20px",
      }}
    >
      <div style={{ maxWidth: "950px", margin: "0 auto" }}>
        <div
          style={{
            color: "#0891b2",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          SEAGUARD AI • ACCOUNT MANAGEMENT
        </div>

        <h1 style={{ color: "#0b1f3a", marginBottom: "8px" }}>
          My Profile
        </h1>

        <p style={{ color: "#64748b", marginBottom: "28px" }}>
          View your SeaGuard AI account information, access level,
          and security settings.
        </p>

        {/* =====================================
            ACCOUNT INFORMATION CARD
        ===================================== */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            boxShadow: "0 5px 25px rgba(15,23,42,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap",
              paddingBottom: "25px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg,#0369a1,#06b6d4)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                fontWeight: "800",
              }}
            >
              {initials}
            </div>

            <div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>
                {user?.username || "Unknown User"}
              </h2>

              <div
                style={{
                  color: "#0284c7",
                  fontSize: "13px",
                  fontWeight: "700",
                  marginTop: "6px",
                  textTransform: "uppercase",
                }}
              >
                {role} Account
              </div>
            </div>
          </div>

          <h3
            style={{
              color: "#0f172a",
              marginTop: "28px",
              marginBottom: "18px",
            }}
          >
            Account Information
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              ["Username", user?.username || "Not available"],
              ["Email Address", user?.email || "Not available"],
              ["Account Role", role.toUpperCase()],
              [
                "Account Status",
                user?.is_active === true
                  ? "Active"
                  : user?.is_active === false
                  ? "Inactive"
                  : "Not available",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    color: "#0f172a",
                    fontSize: "15px",
                    fontWeight: "700",
                    overflowWrap: "anywhere",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "26px",
              padding: "16px",
              borderRadius: "12px",
              background: "#ecfeff",
              border: "1px solid #a5f3fc",
              color: "#155e75",
              fontSize: "13px",
              lineHeight: "1.7",
            }}
          >
            🔐 Your account is protected by the SeaGuard AI
            Security &amp; Access Agent. Access permissions
            are determined by your assigned role.
          </div>
        </div>

        {/* =====================================
            CHANGE PASSWORD CARD
        ===================================== */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            marginTop: "24px",
            boxShadow: "0 5px 25px rgba(15,23,42,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "23px",
              }}
            >
              🔑
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#0b1f3a",
                  fontSize: "20px",
                }}
              >
                Change Password
              </h2>

              <p
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  margin: "5px 0 0",
                }}
              >
                Update your password to keep your account secure.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleChangePassword}
            style={{ maxWidth: "600px" }}
          >
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="current-password"
                style={labelStyle}
              >
                Current Password
              </label>

              <input
                id="current-password"
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                placeholder="Enter your current password"
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="new-password"
                style={labelStyle}
              >
                New Password
              </label>

              <input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter your new password"
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="confirm-password"
                style={labelStyle}
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm your new password"
                style={inputStyle}
                required
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                fontSize: "13px",
                color: "#475569",
                cursor: "pointer",
                marginBottom: "18px",
              }}
            >
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) =>
                  setShowPasswords(e.target.checked)
                }
              />
              Show passwords
            </label>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                color: "#475569",
                fontSize: "13px",
                lineHeight: "1.8",
              }}
            >
              <strong style={{ color: "#0f172a" }}>
                Password requirements
              </strong>

              <div>• At least 8 characters</div>
              <div>• One uppercase and one lowercase letter</div>
              <div>• At least one number</div>
              <div>• At least one special character</div>
              <div>• Maximum 72 UTF-8 bytes</div>
              <div>• Must be different from current password</div>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "13px",
                  marginBottom: "18px",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#15803d",
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "13px",
                  marginBottom: "18px",
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(135deg,#0369a1,#0891b2)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "14px 24px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                minWidth: "180px",
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
