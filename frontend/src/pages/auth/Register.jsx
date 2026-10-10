import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { registerUser } from "../../services/authApi";
import AuthLayout from "./AuthLayout";

const passwordRules = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
  { label: "No leading or trailing spaces", test: (v) => v === v.trim() },
  { label: "Maximum 72 UTF-8 bytes", test: (v) => new TextEncoder().encode(v).length <= 72 },
];

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requirementsOpen, setRequirementsOpen] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (error) setError("");
  };
  const passedRules = passwordRules.filter((rule) => rule.test(formData.password)).length;
  const passwordValid = formData.password.length > 0 && passedRules === passwordRules.length;
  const strength = !formData.password ? { label: "", color: "#e2e8f0", width: "0%" } : passedRules <= 3 ? { label: "Weak password", color: "#ef4444", width: "33%" } : !passwordValid ? { label: "Almost there", color: "#f59e0b", width: "70%" } : { label: "Meets requirements", color: "#10b981", width: "100%" };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!formData.username.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError("Please complete all required fields."); return;
    }
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(formData.username.trim())) {
      setError("Username must contain 3-50 letters, numbers or underscores."); return;
    }
    if (!passwordValid) {
      setRequirementsOpen(true);
      setError("Please make sure your password meets all security requirements."); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match."); return;
    }
    try {
      setLoading(true);
      await registerUser({ username: formData.username.trim(), email: formData.email.trim(), password: formData.password });
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="register">
      <span className="sa-section-kicker">JOIN SEAGUARD AI</span>
      <h2 className="sa-title">Create your account</h2>
      <p className="sa-subtitle">Get started with your secure maritime intelligence workspace.</p>
      <form className="sa-form sa-register-form" onSubmit={handleSubmit}>
        <div className="sa-field"><label htmlFor="register-username">Username</label><input id="register-username" name="username" type="text" value={formData.username} onChange={handleChange} placeholder="Choose a username" autoComplete="username" minLength={3} maxLength={50} required disabled={loading}/></div>
        <div className="sa-field"><label htmlFor="register-email">Email Address</label><input id="register-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" autoComplete="email" required disabled={loading}/></div>
        <div className="sa-field"><div className="sa-label-row"><label htmlFor="register-password">Password</label><button className="sa-text-button" type="button" onClick={() => setRequirementsOpen((v) => !v)} aria-expanded={requirementsOpen}>Password rules</button></div><div className="sa-password-wrap"><input id="register-password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} onFocus={() => setRequirementsOpen(true)} placeholder="Create a strong password" autoComplete="new-password" required disabled={loading} aria-describedby="password-help"/><button type="button" className="sa-eye" onClick={() => setShowPassword((v) => !v)} disabled={loading} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
          {formData.password && <div className="sa-strength"><div className="sa-strength-track"><div style={{ width: strength.width, background: strength.color }}/></div><span style={{ color: strength.color }}>{strength.label}</span></div>}
          {requirementsOpen && <div className="sa-rules" id="password-help"><strong>Create a secure password</strong><div className="sa-rule-grid">{passwordRules.map((rule) => { const passed = rule.test(formData.password); return <span key={rule.label} className={passed ? "sa-rule-passed" : ""}>{passed ? "✓" : "○"} {rule.label}</span>; })}</div></div>}
        </div>
        <div className="sa-field"><label htmlFor="register-confirm-password">Confirm Password</label><div className="sa-password-wrap"><input id="register-confirm-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" autoComplete="new-password" required disabled={loading}/><button type="button" className="sa-eye" onClick={() => setShowConfirmPassword((v) => !v)} disabled={loading} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}>{showConfirmPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>{formData.confirmPassword && <span className={`sa-match ${formData.password === formData.confirmPassword ? "sa-match-ok" : "sa-match-bad"}`}>{formData.password === formData.confirmPassword ? "✓ Passwords match" : "Passwords do not match"}</span>}</div>
        {error && <div className="sa-alert sa-alert-error" role="alert">{error}</div>}
        {success && <div className="sa-alert sa-alert-success" role="status"><CheckCircle2 size={19}/>{success}</div>}
        <button type="submit" className="sa-submit" disabled={loading}>{loading ? "Creating Account..." : <>Create Account <ArrowRight size={18}/></>}</button>
      </form>
      <p className="sa-switch">Already have an account? <Link to="/login">Sign In</Link></p>
    </AuthLayout>
  );
}
