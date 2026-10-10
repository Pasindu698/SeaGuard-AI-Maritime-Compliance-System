import { useState } from "react";
import {
  FileText,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  LoaderCircle,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import useVoiceInput from "../../hooks/useVoiceInput";

const MAX_LENGTH = 5000;

export default function IncidentInput({
  description,
  onDescriptionChange,
  selectedFile,
  uploadedDocument,
  uploading,
  analyzing,
  onAnalyze,
  onClear,
  error,
}) {
  const [language, setLanguage] = useState("en-US");

  const {
    isListening,
    voiceError,
    startListening,
    stopListening,
    clearVoiceError,
  } = useVoiceInput({
    language,
    onTranscript: (transcript) => {
      onDescriptionChange((previous) =>
        `${previous}${previous.trim() ? " " : ""}${transcript}`.slice(
          0,
          MAX_LENGTH
        )
      );
    },
  });

  const disabled = uploading || analyzing;

  function handleAnalyze() {
    stopListening();
    onAnalyze();
  }

  function handleClear() {
    stopListening();
    clearVoiceError();
    onClear();
  }

  return (
    <>
      <div className="aiw-heading aiw-input-heading">
        <FileText size={24} />
        <div>
          <h2>Incident Description</h2>
          <p>Describe the incident or use voice input.</p>
        </div>
      </div>

      <textarea
        rows={6}
        value={description}
        maxLength={MAX_LENGTH}
        disabled={disabled}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Example: An engine room fire has occurred. Analyze the risk and provide emergency recommendations."
      />

      <div className="aiw-input-actions">
        <span>{description.length} / {MAX_LENGTH}</span>

        <div className="aiw-voice-controls">
          <select
            className="aiw-language-select"
            value={language}
            disabled={disabled || isListening}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en-US">English</option>
            <option value="si-LK">සිංහල</option>
          </select>

          <button
            type="button"
            className={`aiw-voice-btn ${isListening ? "listening" : ""}`}
            disabled={disabled}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? (
              <>
                <MicOff size={17} /> Stop Listening
              </>
            ) : (
              <>
                <Mic size={17} /> Voice Input
              </>
            )}
          </button>
        </div>
      </div>

      {isListening && (
        <p className="aiw-listening-text">
          <span className="aiw-recording-dot" />
          Listening... Speak clearly into your microphone.
        </p>
      )}

      {voiceError && (
        <div className="aiw-error" role="alert">
          <AlertTriangle size={17} />
          {voiceError}
        </div>
      )}

      <div className="aiw-analysis-note">
        <ShieldCheck size={16} />
        <span>
          {uploadedDocument
            ? "Uploaded document will be included in the assessment."
            : "You can analyze a text-only incident without a document."}
        </span>
      </div>

      <button
        type="button"
        className="aiw-analyze"
        onClick={handleAnalyze}
        disabled={
          disabled ||
          isListening ||
          !description.trim() ||
          Boolean(selectedFile && !uploadedDocument)
        }
      >
        {analyzing ? (
          <>
            <LoaderCircle size={19} className="aiw-spin" />
            Analyzing with AI Agents...
          </>
        ) : (
          <>
            <Sparkles size={19} />
            Analyze with AI Agents
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <button
        type="button"
        className="aiw-clear-btn"
        onClick={handleClear}
        disabled={disabled}
      >
        Clear Workspace
      </button>

      {error && (
        <div className="aiw-error" role="alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
    </>
  );
}