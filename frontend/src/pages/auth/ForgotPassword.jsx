
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 503
            ? "Email service is temporarily unavailable."
            : "Unable to process your request."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the server. Please try again."
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

        <h2>Forgot Password?</h2>

        <p>
          Enter your registered email address and we'll send
          you a secure password reset link.
        </p>

        {error && (
          <div className="reset-error" role="alert">
            {error}
          </div>
        )}

        {success ? (
          <div className="reset-success" role="status">
            If an active account exists for this email,
            a password reset link will be sent.
            Please check your inbox and spam folder.
          </div>
        ) : (
          <form className="reset-form" onSubmit={handleSubmit}>
            <label htmlFor="forgot-email">
              Email Address
            </label>

            <input
              id="forgot-email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
              maxLength={100}
            />

            <button type="submit" disabled={loading}>
              {loading
                ? "Sending Reset Link..."
                : "Send Reset Link"}
            </button>
          </form>
        )}

        <Link to="/login" className="reset-back">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
