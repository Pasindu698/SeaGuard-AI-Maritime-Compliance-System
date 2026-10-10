import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import AuthLayout from "./AuthLayout";

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
      const response = await fetch("http://127.0.0.1:8000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!response.ok) {
        throw new Error(response.status === 503 ? "Email service is temporarily unavailable." : "Unable to process your request.");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof TypeError ? "Cannot connect to the server. Please try again." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="forgot">
      <span className="sa-section-kicker">ACCOUNT RECOVERY</span>
      <div className="sa-form-icon"><Mail size={25}/></div>
      <h2 className="sa-title">Forgot your password?</h2>
      <p className="sa-subtitle">Enter your registered email address and we'll send you a secure password reset link.</p>
      {error && <div className="sa-alert sa-alert-error" role="alert">{error}</div>}
      {success ? (
        <div className="sa-alert sa-alert-success" role="status"><CheckCircle2 size={22}/><span>If an active account exists for this email, a password reset link will be sent. Please check your inbox and spam folder.</span></div>
      ) : (
        <form className="sa-form" onSubmit={handleSubmit}>
          <div className="sa-field"><label htmlFor="forgot-email">Email Address</label><input id="forgot-email" type="email" placeholder="Enter your registered email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={100} disabled={loading}/></div>
          <button type="submit" className="sa-submit" disabled={loading}>{loading ? "Sending Reset Link..." : <>Send Reset Link <ArrowRight size={18}/></>}</button>
        </form>
      )}
      <p className="sa-switch"><Link to="/login">← Back to Login</Link></p>
    </AuthLayout>
  );
}
