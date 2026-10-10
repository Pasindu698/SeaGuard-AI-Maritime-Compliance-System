import {
  BrainCircuit,
  ShieldCheck,
  FileText,
  BookOpen,
  Sparkles,
} from "lucide-react";

const agents = [
  {
    number: "01",
    name: "Security & Access",
    details: "JWT authentication and access permissions",
    icon: ShieldCheck,
  },
  {
    number: "02",
    name: "Document & Query",
    details: "Document extraction and incident insights",
    icon: FileText,
  },
  {
    number: "03",
    name: "Compliance & Retrieval",
    details: "Maritime requirements and source references",
    icon: BookOpen,
  },
  {
    number: "04",
    name: "Coordinator",
    details: "Risk assessment and final coordinated response",
    icon: BrainCircuit,
  },
];

export default function AgentWorkflow() {
  return (
    <section className="aiw-card">
      <div className="aiw-heading">
        <BrainCircuit size={24} />
        <div>
          <h2>Multi-Agent Workflow</h2>
          <p>Four specialized agents working together.</p>
        </div>
      </div>

      <div className="aiw-agents">
        {agents.map((agent) => {
          const Icon = agent.icon;

          return (
            <div className="aiw-agent" key={agent.number}>
              <span className="aiw-agent-number">
                {agent.number}
              </span>

              <div className="aiw-agent-content">
                <strong>{agent.name}</strong>
                <p>{agent.details}</p>
              </div>

              <Icon size={19} className="aiw-agent-icon" />
            </div>
          );
        })}
      </div>

      <div className="aiw-workflow-summary">
        <div className="aiw-workflow-title">
          <Sparkles size={18} />
          Coordinated Intelligence
        </div>
        <p>
          The Coordinator combines document context,
          compliance retrieval, risk assessment and escalation
          into one unified response.
        </p>
      </div>

      <div className="aiw-notice">
        <ShieldCheck size={19} />
        <span>
          AI assessments support responsible officers and do
          not replace approved vessel emergency procedures
          or the master's authority.
        </span>
      </div>
    </section>
  );
}