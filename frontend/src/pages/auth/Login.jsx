import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    if (error) setError("");
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
      await login(formData.username.trim(), formData.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <span className="sa-section-kicker">WELCOME BACK</span>
      <h2 className="sa-title">Sign in to your account</h2>
      <p className="sa-subtitle">Enter your credentials to access the SeaGuard AI workspace.</p>
      <form className="sa-form" onSubmit={handleSubmit}>
        <div className="sa-field"><label htmlFor="login-username">Username</label><input id="login-username" type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Enter your username" autoComplete="username" disabled={loading} required /></div>
        <div className="sa-field"><div className="sa-label-row"><label htmlFor="login-password">Password</label><Link to="/forgot-password" className="sa-inline-link">Forgot password?</Link></div><div className="sa-password-wrap"><input id="login-password" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" disabled={loading} required /><button type="button" className="sa-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></div>
        {error && <div className="sa-alert sa-alert-error" role="alert">{error}</div>}
        <button type="submit" className="sa-submit" disabled={loading}>{loading ? "Signing In..." : <>Sign In <ArrowRight size={18}/></>}</button>
      </form>
      <p className="sa-switch">Don't have an account? <Link to="/register">Create Account</Link></p>
      <p className="sa-security-note">🔒 Protected by SeaGuard Security & Access Agent</p>
    </AuthLayout>
  );
}
