import {
  BrainCircuit,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  FileCheck2,
  Info,
} from "lucide-react";

const SECTION_CONFIG = {
  "INCIDENT ASSESSMENT": {
    title: "Incident Assessment",
    icon: FileCheck2,
    className: "incident",
  },
  "ESCALATION ASSESSMENT": {
    title: "Escalation Assessment",
    icon: AlertTriangle,
    className: "escalation",
  },
  "PRIORITY RECOMMENDATIONS": {
    title: "Priority Recommendations",
    icon: ClipboardList,
    className: "recommendations",
  },
  "IMPORTANT NOTICE": {
    title: "Important Notice",
    icon: Info,
    className: "notice",
  },
};

function parseFinalResponse(text) {
  if (typeof text !== "string" || !text.trim()) {
    return [];
  }

  const sections = [];
  let currentSection = null;

  const lines = text.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (SECTION_CONFIG[trimmed]) {
      currentSection = {
        heading: trimmed,
        lines: [],
      };

      sections.push(currentSection);
      return;
    }

    if (!currentSection) {
      currentSection = {
        heading: "GENERAL",
        lines: [],
      };

      sections.push(currentSection);
    }

    currentSection.lines.push(line);
  });

  return sections.map((section) => ({
    ...section,
    content: section.lines.join("\n").trim(),
  }));
}

function SectionContent({ section }) {
  const lines = section.content
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (section.heading === "PRIORITY RECOMMENDATIONS") {
    return (
      <ol className="aiw-report-recommendations">
        {lines.map((line, index) => (
          <li key={index}>
            {line.replace(/^\d+\.\s*/, "")}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="aiw-report-lines">
      {lines.map((line, index) => {
        const separatorIndex = line.indexOf(":");

        if (
          section.heading === "INCIDENT ASSESSMENT" &&
          separatorIndex !== -1
        ) {
          return (
            <div className="aiw-report-field" key={index}>
              <span>
                {line.slice(0, separatorIndex).trim()}
              </span>

              <strong>
                {line.slice(separatorIndex + 1).trim()}
              </strong>
            </div>
          );
        }

        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

export default function FinalResponse({
  finalResponse,
  disclaimer,
}) {
  const responseText =
    typeof finalResponse === "string"
      ? finalResponse
      : finalResponse == null
        ? ""
        : JSON.stringify(finalResponse, null, 2);

  const sections = parseFinalResponse(responseText);

  return (
    <>
      <section className="aiw-result-section aiw-final-section">
        <div className="aiw-section-heading">
          <BrainCircuit size={22} />
          <h3>Final Coordinated Response</h3>
        </div>

        {sections.length ? (
          <div className="aiw-report-grid">
            {sections.map((section, index) => {
              const config = SECTION_CONFIG[section.heading] || {
                title: "Additional Information",
                icon: Info,
                className: "general",
              };

              const Icon = config.icon;

              return (
                <article
                  key={index}
                  className={`aiw-report-card aiw-report-${config.className}`}
                >
                  <div className="aiw-report-card-heading">
                    <Icon size={19} />
                    <h4>{config.title}</h4>
                  </div>

                  <SectionContent section={section} />
                </article>
              );
            })}
          </div>
        ) : (
          <p className="aiw-empty-message">
            No final response available.
          </p>
        )}
      </section>

      <div className="aiw-result-disclaimer">
        <ShieldCheck size={19} />

        <span>
          {disclaimer ||
            "SeaGuard AI is a prototype decision-support system. Its output does not replace approved emergency procedures, the master's authority or applicable maritime regulations."}
        </span>
      </div>
    </>
  );
}