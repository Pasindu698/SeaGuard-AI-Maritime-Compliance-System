import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import AuthLayout from "./AuthLayout";
import { acceptUserInvitation } from "../../services/authApi";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Invitation link is missing its token. Request a new invitation from your administrator.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await acceptUserInvitation(token, password);
      setCompleted(true);
      setPassword("");
      setConfirmPassword("");
      window.history.replaceState(null, "", "/accept-invitation");
    } catch (err) {
      setError(err.message || "Unable to activate account. The invitation may be expired or already used.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <span className="sa-section-kicker">SEAGUARD AI • ACCOUNT INVITATION</span>
      {completed ? (
        <>
          <CheckCircle2 size={42} color="#059669" aria-hidden="true" />
          <h2 className="sa-title">Account activated!</h2>
          <p className="sa-subtitle">Your password is set. You can now sign in using the username in your invitation email.</p>
          <Link to="/login" className="sa-submit" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, textDecoration: "none" }}>
            Go to Login <ArrowRight size={18} />
          </Link>
        </>
      ) : (
        <>
          <h2 className="sa-title">Set your account password</h2>
          <p className="sa-subtitle">Create a secure password to activate your invited Officer or Administrator account.</p>
          {!token ? (
            <div className="sa-alert sa-alert-error" role="alert">Invalid invitation link. Ask your administrator to resend the invitation.</div>
          ) : (
            <form className="sa-form" onSubmit={handleSubmit}>
              <div className="sa-field">
                <label htmlFor="invitation-password">New Password</label>
                <div className="sa-password-wrap">
                  <input id="invitation-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" disabled={loading} minLength={8} required />
                  <button type="button" className="sa-eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                </div>
              </div>
              <div className="sa-field">
                <label htmlFor="invitation-confirm-password">Confirm Password</label>
                <input id="invitation-confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" disabled={loading} minLength={8} required />
              </div>
              <p className="sa-security-note">Use 8–72 UTF-8 bytes, including uppercase, lowercase, a number and a special character.</p>
              {error && <div className="sa-alert sa-alert-error" role="alert">{error}</div>}
              <button type="submit" className="sa-submit" disabled={loading}>{loading ? "Activating Account..." : <>Activate Account <ArrowRight size={18} /></>}</button>
            </form>
          )}
          <p className="sa-switch">Already activated? <Link to="/login">Sign In</Link></p>
        </>
      )}
      <p className="sa-security-note">🔒 Protected by SeaGuard Security &amp; Access Agent</p>
    </AuthLayout>
  );
}
