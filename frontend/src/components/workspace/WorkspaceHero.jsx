import {
  Ship,
  ShieldCheck,
  BrainCircuit,
  BookOpen,
} from "lucide-react";

export default function WorkspaceHero() {
  return (
    <section className="aiw-hero">
      <div className="aiw-eyebrow">
        <Ship size={18} />
        SEAGUARD AI
      </div>

      <h1>
        Unified Maritime <span>AI Workspace</span>
      </h1>

      <p>
        Intelligent maritime emergency, security and incident
        management powered by coordinated AI agents.
      </p>

      <div className="aiw-hero-tags">
        <span><ShieldCheck size={16} /> Secure Access</span>
        <span><BrainCircuit size={16} /> Multi-Agent Intelligence</span>
        <span><BookOpen size={16} /> Maritime Compliance</span>
      </div>
    </section>
  );
}