
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (value) => {
    if (value.length < 8 || value.length > 72) {
      return "Password must contain 8–72 characters.";
    }

    if (new TextEncoder().encode(value).length > 72) {
      return "Password must not exceed 72 UTF-8 bytes.";
    }

    if (value.trim() !== value) {
      return "Password cannot start or end with spaces.";
    }

    if (
      !/[A-Z]/.test(value) ||
      !/[a-z]/.test(value) ||
      !/[0-9]/.test(value) ||
      !/[^A-Za-z0-9]/.test(value)
    ) {
      return "Include uppercase, lowercase, number and special character.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset link is missing. Request a new reset email.");
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            new_password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Password reset failed. Please request a new link."
        );
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setMessage(
        "Your password has been reset successfully. You can now log in."
      );

      // Remove the sensitive token from the browser address bar.
      window.history.replaceState(
        window.history.state,
        "",
        "/reset-password"
      );
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the server. Check that the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-brand">
          <div className="reset-brand-icon">⚓</div>
          <span>SeaGuard AI</span>
        </div>

        <h2>Reset Password</h2>

        <p>
          Create a new secure password to protect your
          SeaGuard AI account.
        </p>

        {!token && !success && (
          <div className="reset-error" role="alert">
            This reset link is missing a token.
            Please request a new password reset email.
          </div>
        )}

        {error && (
          <div className="reset-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="reset-success" role="status">
            {message}
          </div>
        )}

        {!success && (
          <form
            className="reset-form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="new-password">
              New Password
            </label>

            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
            />

            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
            />

            <label className="reset-show-password">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) =>
                  setShowPassword(e.target.checked)
                }
              />
              Show passwords
            </label>

            <div className="reset-password-hint">
              Use at least 8 characters, including uppercase,
              lowercase, number and special character.
            </div>

            <button
              type="submit"
              disabled={loading || !token}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="reset-back"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
