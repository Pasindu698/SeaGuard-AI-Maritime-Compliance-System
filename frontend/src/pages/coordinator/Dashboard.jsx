
import { Link } from "react-router-dom";
import {
  Anchor,
  ArrowRight,
  Box,
  FileText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./Coordinator.css";

const modules = [
  {
    title: "Incident Coordinator",
    description:
      "Analyze maritime incidents, assess risk, review recommended actions, and identify escalation requirements.",
    link: "/coordinator",
    action: "Coordinate Incident",
    icon: Zap,
    theme: "blue",
  },
  {
    title: "Document Analysis",
    description:
      "Upload maritime documents and extract important information, summaries, and incident details.",
    link: "/documents",
    action: "Analyze Document",
    icon: FileText,
    theme: "green",
  },
  {
    title: "Document Q&A",
    description:
      "Ask questions about maritime documents and retrieve relevant information.",
    link: "/documents/query",
    action: "Ask a Question",
    icon: Sparkles,
    theme: "purple",
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="sg-dashboard">
      <div className="sg-dashboard-container">

        {/* HERO SECTION */}
        <section className="sg-hero">
          <div className="sg-hero-overlay" />

          <div className="sg-radar">
            <div className="sg-radar-center" />
          </div>

          <div className="sg-hero-content">
            <div className="sg-eyebrow">
              MARITIME SAFETY & INTELLIGENCE
              <span className="sg-eyebrow-line" />
            </div>

            <h1>
              Welcome to <span>SeaGuard AI</span>
            </h1>

            <p>
              An intelligent maritime emergency, security,
              and incident management assistant powered by
              coordinated AI agents.
            </p>

            <div className="sg-hero-actions">
              <Link
                to="/coordinator"
                className="sg-primary-btn"
              >
                <Zap size={18} />
                Coordinate an Incident
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/documents"
                className="sg-secondary-btn"
              >
                <FileText size={18} />
                Analyze Documents
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          <div className="sg-hero-intelligence">
            <h3>SeaGuard Intelligence</h3>
            <p>Maritime Emergency Response Platform</p>

            <div className="sg-hero-status">
              <span className="sg-live-dot" />
              AI-Assisted Analysis
            </div>
          </div>
        </section>

        {/* ACCOUNT OVERVIEW */}
        <section className="sg-overview-grid">
          <div className="sg-overview-card">
            <div className="sg-overview-icon">
              <UserRound size={27} />
            </div>

            <div>
              <span className="sg-overview-label">
                SIGNED IN AS
              </span>

              <strong>
                {user?.username || "User"}
              </strong>
            </div>
          </div>

          <div className="sg-overview-card">
            <div className="sg-overview-icon">
              <ShieldCheck size={27} />
            </div>

            <div>
              <span className="sg-overview-label">
                ACCESS ROLE
              </span>

              <strong className="sg-role-value">
                {user?.role || "Unknown"}
              </strong>
            </div>
          </div>

          <div className="sg-overview-card">
            <div className="sg-overview-icon">
              <Box size={27} />
            </div>

            <div>
              <span className="sg-overview-label">
                AVAILABLE MODULES
              </span>

              <strong>{modules.length}</strong>
            </div>
          </div>
        </section>

        {/* MODULES */}
        <section className="sg-modules-section">
          <div className="sg-section-kicker">
            EXPLORE THE PLATFORM
            <span />
          </div>

          <h2>Maritime Intelligence Tools</h2>

          <p className="sg-section-description">
            Access the key modules of the SeaGuard AI platform.
          </p>

          <div className="sg-modules-grid">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <article
                  className="sg-module-card"
                  key={module.title}
                >
                  <div className="sg-module-content">
                    <div
                      className={`sg-module-icon sg-module-${module.theme}`}
                    >
                      <Icon size={31} strokeWidth={2.2} />
                    </div>

                    <div className="sg-module-text">
                      <h3>{module.title}</h3>
                      <p>{module.description}</p>
                    </div>
                  </div>

                  <Link
                    to={module.link}
                    className="sg-module-action"
                  >
                    {module.action}
                    <ArrowRight size={19} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        {/* SAFETY NOTICE */}
        <section className="sg-safety-banner">
          <div className="sg-safety-icon">
            <ShieldCheck size={32} />
          </div>

          <div>
            <h3>Safety-Focused AI Assistance</h3>

            <p>
              SeaGuard AI supports incident analysis and
              decision-making. High-risk situations must
              be reviewed by an authorized human officer.
              AI recommendations do not replace official
              emergency procedures.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
