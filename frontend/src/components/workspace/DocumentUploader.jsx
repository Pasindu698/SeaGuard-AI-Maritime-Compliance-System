import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  LoaderCircle,
  CheckCircle2,
  X,
} from "lucide-react";

const ALLOWED = [".pdf", ".txt", ".png", ".jpg", ".jpeg"];

export default function DocumentUploader({
  selectedFile,
  uploadedDocument,
  uploading,
  analyzing,
  uploadMessage,
  onFileSelect,
  onUpload,
  onRemove,
  onError,
}) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const disabled = uploading || analyzing;

  function selectFile(file) {
    if (!file || disabled) return;

    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!ALLOWED.includes(extension)) {
      onError("Please select a PDF, TXT, PNG, JPG or JPEG file.");
      return;
    }

    onFileSelect(file);
  }

  function removeFile() {
    if (disabled) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemove();
  }

  return (
    <>
      <div className="aiw-heading">
        <UploadCloud size={24} />
        <div>
          <h2>Incident Document</h2>
          <p>Upload an incident report for document-assisted analysis.</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.png,.jpg,.jpeg"
        hidden
        disabled={disabled}
        onChange={(e) => selectFile(e.target.files?.[0])}
      />

      <div
        className={`aiw-upload-placeholder ${dragging ? "dragging" : ""}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          selectFile(e.dataTransfer.files?.[0]);
        }}
      >
        <UploadCloud size={34} />
        <strong>
          {selectedFile?.name || "Choose or Drop Document"}
        </strong>
        <p>PDF, TXT and supported images</p>
        <small>Click to browse or drag and drop a file</small>
      </div>

      {selectedFile && (
        <div className="aiw-file-actions">
          <div className="aiw-selected-file">
            <FileText size={19} />
            <span>{selectedFile.name}</span>
          </div>

          <button
            type="button"
            onClick={onUpload}
            disabled={disabled || Boolean(uploadedDocument)}
          >
            {uploading ? (
              <>
                <LoaderCircle size={16} className="aiw-spin" />
                Uploading...
              </>
            ) : uploadedDocument ? (
              <>
                <CheckCircle2 size={16} />
                Uploaded
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                Upload Document
              </>
            )}
          </button>

          <button
            type="button"
            onClick={removeFile}
            disabled={disabled}
            aria-label="Remove document"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {uploadMessage && (
        <div className="aiw-success" role="status">
          <CheckCircle2 size={18} />
          {uploadMessage}
        </div>
      )}
    </>
  );
}