import { useRef, useState } from "react";

function UploadBox({ onFileSelect, selectedFile, disabled = false }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const allowedExtensions = ["pdf", "txt", "jpg", "jpeg", "png"];

  const validateFile = (file) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      alert("Only PDF, TXT, JPG, JPEG and PNG files are supported.");
      return;
    }

    onFileSelect(file);
  };

  const handleFileChange = (event) => {
    validateFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    validateFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? "#2563eb" : "#94a3b8"}`,
        borderRadius: "16px",
        padding: "40px 24px",
        textAlign: "center",
        background: isDragging ? "#eff6ff" : "#f8fafc",
        transition: "0.2s",
      }}
    >
      <div style={{ fontSize: "42px", marginBottom: "12px" }}>📄</div>

      <h3 style={{ marginBottom: "8px" }}>
        Upload Maritime Document
      </h3>

      <p style={{ color: "#64748b", marginBottom: "20px" }}>
        Drag and drop your document here, or choose a file
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        hidden
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        style={{
          padding: "11px 22px",
          border: "none",
          borderRadius: "8px",
          background: "#0f172a",
          color: "white",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: "600",
        }}
      >
        Choose File
      </button>

      <p
        style={{
          marginTop: "14px",
          marginBottom: "0",
          fontSize: "13px",
          color: "#64748b",
        }}
      >
        Supported formats: PDF, TXT, JPG, JPEG, PNG
      </p>

      {selectedFile && (
        <div
          style={{
            marginTop: "22px",
            padding: "12px",
            borderRadius: "8px",
            background: "#e2e8f0",
          }}
        >
          <strong>Selected:</strong> {selectedFile.name}
        </div>
      )}
    </div>
  );
}

export default UploadBox;