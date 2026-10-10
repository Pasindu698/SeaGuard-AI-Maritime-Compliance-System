import { Link } from "react-router-dom";
import { Anchor, ArrowLeft, ShieldCheck, LockKeyhole, Activity, FileCheck2 } from "lucide-react";
import "./Auth.css";

export default function AuthLayout({ children, mode = "login" }) {
  return (
    <main className="sa-page">
      <div className="sa-shell">
        <aside className="sa-brand-panel">
          <Link className="sa-brand" to="/" aria-label="SeaGuard AI home">
            <span className="sa-brand-icon"><Anchor size={29} strokeWidth={2}/></span>
            <span><strong>SeaGuard <em>AI</em></strong><small>SAFE SEAS. SMARTER DECISIONS.</small></span>
          </Link>
          <div className="sa-brand-content">
            <span className="sa-kicker"><span className="sa-live-dot"/> SECURE MARITIME PLATFORM</span>
            <h1>Secure Access.<br/><span>Smarter Operations.</span></h1>
            <p>One intelligent workspace for maritime safety, incident coordination and compliance.</p>
            <div className="sa-brand-features">
              <div><ShieldCheck size={20}/><span>Role-based secure access</span></div>
              <div><Activity size={20}/><span>AI-assisted incident management</span></div>
              <div><FileCheck2 size={20}/><span>Maritime compliance intelligence</span></div>
            </div>
          </div>
          <div className="sa-brand-bottom"><LockKeyhole size={15}/> Protected by SeaGuard Security & Access Agent</div>
          <div className="sa-orbit sa-orbit-one" aria-hidden="true"/>
          <div className="sa-orbit sa-orbit-two" aria-hidden="true"/>
        </aside>
        <section className="sa-form-panel">
          <div className="sa-form-top"><Link to="/" className="sa-home-link"><ArrowLeft size={16}/> Back to Home</Link><span className="sa-portal-label">SEAGUARD AI PORTAL</span></div>
          <div className={`sa-form-inner ${mode === "register" ? "sa-register-inner" : ""}`}>
            {children}
          </div>
          <div className="sa-form-footer">© {new Date().getFullYear()} SeaGuard AI · Secure Maritime Intelligence</div>
        </section>
      </div>
    </main>
  );
}
