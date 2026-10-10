
import { useState } from "react";

import { useAuth } from "../../context/AuthContext";

import { uploadDocument } from "../../services/documentApi";
import { coordinateIncident } from "../../services/coordinatorApi";

import WorkspaceHero from "../../components/workspace/WorkspaceHero";
import DocumentUploader from "../../components/workspace/DocumentUploader";
import IncidentInput from "../../components/workspace/IncidentInput";
import AgentWorkflow from "../../components/workspace/AgentWorkflow";
import AssessmentResults from "../../components/workspace/AssessmentResults";
import ReferenceSelector from "../../components/workspace/ReferenceSelector";

import "./AIWorkspace.css";

// =====================================
// QUICK INCIDENT QUESTIONS
// =====================================

const QUICK_QUESTIONS = [
  {
    id: "fire",
    icon: "🔥",
    title: "Fire Emergency",
    question:
      "What immediate actions should the crew take during an engine room fire onboard a vessel?",
  },
  {
    id: "overboard",
    icon: "🛟",
    title: "Person Overboard",
    question:
      "What emergency procedures should be followed when a crew member falls overboard?",
  },
  {
    id: "collision",
    icon: "🚢",
    title: "Vessel Collision",
    question:
      "What immediate safety and emergency response procedures should be followed after a vessel collision?",
  },
  {
    id: "security",
    icon: "🛡️",
    title: "Security Incident",
    question:
      "How should the crew respond to unauthorized access or suspicious activity onboard a vessel?",
  },
  {
    id: "medical",
    icon: "🏥",
    title: "Medical Emergency",
    question:
      "What actions should be taken when a crew member experiences a medical emergency at sea?",
  },
  {
    id: "risk",
    icon: "⚠️",
    title: "Risk Assessment",
    question:
      "How should a maritime safety incident be assessed and classified according to its risk severity?",
  },
];

// =====================================
// QUICK QUESTIONS COMPONENT
// =====================================

function QuickQuestions({
  onSelect,
  disabled,
  description,
}) {
  return (
    <div className="aiw-quick-section">
      <div className="aiw-quick-heading">
        <div className="aiw-quick-heading-icon">
          ✦
        </div>

        <div>
          <h3>Quick Incident Questions</h3>
          <p>
            Select a common maritime scenario to
            fill the incident description.
          </p>
        </div>
      </div>

      <div className="aiw-quick-grid">
        {QUICK_QUESTIONS.map((item) => {
          const selected =
            description.trim() === item.question;

          return (
            <button
              key={item.id}
              type="button"
              className={`aiw-quick-card ${
                selected
                  ? "aiw-quick-selected"
                  : ""
              }`}
              onClick={() =>
                onSelect(item.question)
              }
              disabled={disabled}
              aria-pressed={selected}
              title={item.question}
            >
              <span className="aiw-quick-icon">
                {item.icon}
              </span>

              <span className="aiw-quick-title">
                {item.title}
              </span>

              <span className="aiw-quick-arrow">
                ↗
              </span>
            </button>
          );
        })}
      </div>

      <p className="aiw-quick-hint">
        You can edit the selected question before
        running the analysis.
      </p>
    </div>
  );
}

// =====================================
// MAIN AI WORKSPACE
// =====================================

export default function AIWorkspace() {
  const { token } = useAuth();

  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocument, setUploadedDocument] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [referenceLimit, setReferenceLimit] = useState(5);

  // =====================================
  // QUICK QUESTION SELECTION
  // =====================================

  const handleQuickQuestion = (question) => {
    if (uploading || analyzing) return;

    // Fill Incident Description automatically.
    setDescription(question);

    // Clear previous analysis result and errors.
    setResult(null);
    setError("");
  };

  // =====================================
  // FILE SELECTION
  // =====================================

  const handleFileSelection = (file) => {
    if (!file || uploading || analyzing) return;

    setSelectedFile(file);
    setUploadedDocument(null);
    setResult(null);
    setError("");
    setUploadMessage("");
  };

  // =====================================
  // REMOVE FILE
  // =====================================

  const handleRemoveFile = () => {
    if (uploading || analyzing) return;

    setSelectedFile(null);
    setUploadedDocument(null);
    setResult(null);
    setError("");
    setUploadMessage("");
  };

  // =====================================
  // UPLOAD DOCUMENT
  // =====================================

  const handleUpload = async () => {
    if (!selectedFile || uploading || analyzing) return;

    if (!token) {
      setError("Please log in before uploading a document.");
      return;
    }

    setUploading(true);
    setError("");
    setUploadMessage("");

    try {
      const data = await uploadDocument(selectedFile, token);

      if (!data?.document_id) {
        throw new Error(
          "Document uploaded but no document ID was returned."
        );
      }

      setUploadedDocument(data);
      setUploadMessage("Document uploaded successfully.");
    } catch (err) {
      setError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // =====================================
  // RUN MULTI-AGENT ANALYSIS
  // =====================================

  const handleAnalyze = async () => {
    if (analyzing || uploading) return;

    if (!description.trim()) {
      setError("Please describe the incident before analyzing.");
      return;
    }

    if (selectedFile && !uploadedDocument) {
      setError("Please upload the selected document first.");
      return;
    }

    if (!token) {
      setError("Please log in before analyzing an incident.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const data = await coordinateIncident(
        description.trim(),
        referenceLimit,
        token,
        uploadedDocument?.document_id || null
      );

      setResult(data);
    } catch (err) {
      setError(err.message || "Incident analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  // =====================================
  // CLEAR WORKSPACE
  // =====================================

  const handleClear = () => {
    if (uploading || analyzing) return;

    setDescription("");
    setSelectedFile(null);
    setUploadedDocument(null);
    setResult(null);
    setError("");
    setUploadMessage("");
  };

  // =====================================
  // WORKSPACE UI
  // =====================================

  return (
    <div className="aiw-page">
      <div className="aiw-container">
        <WorkspaceHero />

        <div className="aiw-layout">

          {/* =====================================
              LEFT SIDE - INCIDENT INPUT
          ===================================== */}

          <section className="aiw-card">

            <DocumentUploader
              selectedFile={selectedFile}
              uploadedDocument={uploadedDocument}
              uploading={uploading}
              analyzing={analyzing}
              uploadMessage={uploadMessage}
              onFileSelect={handleFileSelection}
              onUpload={handleUpload}
              onRemove={handleRemoveFile}
              onError={setError}
            />

            <ReferenceSelector
              referenceLimit={referenceLimit}
              onReferenceLimitChange={setReferenceLimit}
              disabled={uploading || analyzing}
            />

            <IncidentInput
              description={description}
              onDescriptionChange={setDescription}
              selectedFile={selectedFile}
              uploadedDocument={uploadedDocument}
              uploading={uploading}
              analyzing={analyzing}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              error={error}
            />

          </section>

          {/* =====================================
              RIGHT SIDE - AGENTS + QUESTIONS
          ===================================== */}

          <div className="aiw-right-column">

            {/* EXISTING MULTI-AGENT WORKFLOW */}
            <AgentWorkflow />

            {/* QUICK INCIDENT QUESTIONS */}
            <div className="aiw-right-quick">
              <QuickQuestions
                onSelect={handleQuickQuestion}
                disabled={uploading || analyzing}
                description={description}
              />
            </div>

          </div>

        </div>

        {/* =====================================
            ANALYSIS RESULTS
        ===================================== */}

        <AssessmentResults
          result={result}
          token={token}
        />

      </div>
    </div>
  );
}
