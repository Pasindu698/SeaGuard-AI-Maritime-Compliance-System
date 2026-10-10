
import { useEffect, useState } from "react";
import { X, FileText, LoaderCircle, AlertCircle } from "lucide-react";

import { fetchOriginalDocument } from "../../services/complianceApi";

export default function OriginalDocumentModal({
  source,
  filename,
  token,
  onClose,
}) {
  const [documentUrl, setDocumentUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isPdf = filename?.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!source || !token) {
      setLoading(false);
      setError("Document source or authentication token is missing.");
      return;
    }

    let cancelled = false;
    let objectUrl = "";

    async function loadDocument() {
      setLoading(true);
      setError("");
      setDocumentUrl("");
      setTextContent("");

      try {
        const blob = await fetchOriginalDocument(source, token);

        if (cancelled) return;

        if (isPdf) {
          objectUrl = URL.createObjectURL(
            new Blob([blob], { type: "application/pdf" })
          );
          setDocumentUrl(objectUrl);
        } else {
          const text = await blob.text();
          if (!cancelled) setTextContent(text);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Document preview failed.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, token, isPdf]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="aiw-document-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="aiw-document-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${filename || "document"}`}
      >
        <div className="aiw-document-modal-header">
          <div className="aiw-document-modal-title">
            <FileText size={22} />
            <div>
              <h3>Original Document Preview</h3>
              <p>{filename}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="aiw-document-modal-close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="aiw-document-modal-body">
          {loading ? (
            <div className="aiw-document-modal-message">
              <LoaderCircle className="aiw-spin" size={30} />
              <p>Loading original document...</p>
            </div>
          ) : error ? (
            <div className="aiw-document-modal-message">
              <AlertCircle size={28} />
              <p>{error}</p>
            </div>
          ) : isPdf ? (
            <iframe
              title={`Original document: ${filename}`}
              src={documentUrl}
              className="aiw-document-pdf"
            />
          ) : (
            <pre className="aiw-document-text">
              {textContent}
            </pre>
          )}
        </div>

        <div className="aiw-document-modal-footer">
          Original source document. Verify critical maritime
          procedures against approved and current regulations.
        </div>
      </section>
    </div>
  );
}
