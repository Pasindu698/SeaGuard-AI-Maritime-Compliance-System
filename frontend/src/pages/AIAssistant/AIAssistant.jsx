
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "../../context/AuthContext";
import { uploadDocument } from "../../services/documentApi";

import {
  listConversations,
  getConversation,
  createConversation,
  sendConversationMessage,
  renameConversation,
  deleteConversation,
} from "../../services/chatApi";

import "./AIAssistant.css";

// =====================================
// API CONFIGURATION
// =====================================

const DOCUMENT_API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

const QUICK = [
  "What should crew do during a fire emergency?",
  "Explain SOLAS safety requirements.",
  "How should a security incident be reported?",
  "What does a high-risk incident mean?",
];

// =====================================
// HELPERS
// =====================================

const getId = (item) =>
  item?._id || item?.id || item?.conversation_id;

const getText = (message) =>
  String(message?.content || message?.answer || "");

const getList = (data) =>
  Array.isArray(data)
    ? data
    : data?.conversations || [];

const getMessages = (data) =>
  Array.isArray(data?.messages)
    ? data.messages
    : [];

const isBlocked = (message) =>
  message?.answer_blocked === true ||
  (
    message?.answer_blocked !== false &&
    /generated answer has been withheld|could not verify this answer/i.test(
      getText(message)
    )
  );

// =====================================
// ATTACH DOCUMENT TO FIRST USER MESSAGE
// =====================================

function withFirstAttachment(messages, doc) {
  if (!doc?.document_id) return messages;

  const firstUserIndex = messages.findIndex(
    (message) => message.role === "user"
  );

  if (firstUserIndex < 0) return messages;

  return messages.map((message, index) => {
    if (index !== firstUserIndex) return message;

    return {
      ...message,
      attachment: {
        document_id: doc.document_id,
        filename:
          doc.filename || "Uploaded document",
        isPdf: (doc.filename || "")
          .toLowerCase()
          .endsWith(".pdf"),
        preview_available:
          doc.preview_available === true,
      },
    };
  });
}

// =====================================
// EXPORT CONVERSATION
// =====================================

function exportConversation(title, messages) {
  const lines = [
    `# ${title || "SeaGuard AI Conversation"}`,
    "",
    `Exported: ${new Date().toLocaleString()}`,
    "",
    "> Decision support only. Verify against approved vessel procedures.",
    "",
    "---",
    "",
  ];

  messages.forEach((message) => {
    const assistant = message.role === "assistant";

    lines.push(
      `## ${assistant ? "SeaGuard AI" : "You"}`,
      ""
    );

    if (message.attachment) {
      lines.push(
        `Attachment: ${message.attachment.filename}`,
        ""
      );
    }

    if (assistant && message.verification_status) {
      lines.push(
        `Verification: ${
          isBlocked(message)
            ? "Blocked"
            : message.verification_status
        }`,
        ""
      );
    }

    lines.push(getText(message), "");

    if (assistant && message.sources?.length) {
      lines.push("### Source Evidence", "");

      message.sources.forEach((source) => {
        lines.push(
          `**[${source.citation_id}] ${
            source.filename || "Document"
          }**`,
          "",
          source.excerpt || "",
          ""
        );
      });
    }

    lines.push("---", "");
  });

  const blob = new Blob(
    [lines.join("\n")],
    { type: "text/markdown;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  const safeTitle = String(
    title || "SeaGuard_Conversation"
  )
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 70);

  anchor.href = url;
  anchor.download = `${safeTitle}.md`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// =====================================
// MARKDOWN ANSWER WITH CITATIONS
// =====================================

function MarkdownAnswer({
  text,
  sources,
  onCitation,
}) {
  const validIds = new Set(
    sources.map((source) => source.citation_id)
  );

  const markdown = String(text || "").replace(
    /\[SRC-\d{2}\]/g,
    (match, offset, whole) => {
      const citationId = match.slice(1, -1);

      if (
        !validIds.has(citationId) ||
        whole
          .slice(offset + match.length)
          .startsWith("(")
      ) {
        return match;
      }

      return `[${citationId}](#evidence-${citationId})`;
    }
  );

  return (
    <div className="sg-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("#evidence-SRC-")) {
              const citationId = href.replace(
                "#evidence-",
                ""
              );

              return (
                <button
                  type="button"
                  className="sg-citation-link"
                  onClick={() =>
                    onCitation(citationId)
                  }
                  title={`View evidence ${citationId}`}
                >
                  {children}
                </button>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

// =====================================
// DOCUMENT ATTACHMENT CARD
// =====================================

function AttachmentCard({
  attachment,
  onPreview,
}) {
  return (
    <button
      type="button"
      className="sg-message-attachment"
      onClick={() => onPreview(attachment)}
      title={`Preview ${attachment.filename}`}
    >
      <span className="sg-attachment-icon">
        📄
      </span>

      <span className="sg-attachment-info">
        <strong>
          {attachment.filename ||
            "Uploaded document"}
        </strong>

        <small>
          {attachment.isPdf
            ? "PDF document · Preview"
            : "Attached document"}
        </small>
      </span>

      <span aria-hidden="true">↗</span>
    </button>
  );
}

// =====================================
// CHAT MESSAGE
// =====================================

function Message({ message, onPreview }) {
  const assistant = message.role === "assistant";

  const sources = Array.isArray(message.sources)
    ? message.sources
    : [];

  const [openSources, setOpenSources] =
    useState(false);

  const [selectedSource, setSelectedSource] =
    useState(null);

  const [copied, setCopied] = useState(false);

  const blocked = assistant && isBlocked(message);
  const status = message.verification_status;

  const statusLabel = blocked
    ? "Blocked"
    : status?.replaceAll("_", " ");

  const openCitation = (citationId) => {
    const source = sources.find(
      (item) => item.citation_id === citationId
    );

    if (!source) return;

    setSelectedSource(citationId);
    setOpenSources(true);
  };

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(
        getText(message)
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article
      className={`sg-message ${
        assistant ? "sg-assistant" : "sg-user"
      }`}
    >
      {assistant && (
        <div className="sg-avatar">⚓</div>
      )}

      <div className="sg-message-body">
        <div className="sg-message-head">
          <strong>
            {assistant ? "SeaGuard AI" : "You"}
          </strong>

          {assistant && statusLabel && (
            <span
              className={`sg-status ${
                blocked
                  ? "sg-status-blocked"
                  : `sg-status-${status}`
              }`}
            >
              {blocked
                ? "⛔"
                : status === "supported"
                ? "✓"
                : "⚠"}{" "}
              {statusLabel}
            </span>
          )}
        </div>

        {!assistant && message.attachment && (
          <AttachmentCard
            attachment={message.attachment}
            onPreview={onPreview}
          />
        )}

        {assistant ? (
          <MarkdownAnswer
            text={getText(message)}
            sources={sources}
            onCitation={openCitation}
          />
        ) : (
          <div className="sg-message-text">
            {getText(message)}
          </div>
        )}

        {assistant && (
          <div className="sg-message-actions">
            <button
              type="button"
              onClick={copyAnswer}
            >
              {copied
                ? "✓ Copied"
                : "⧉ Copy answer"}
            </button>

            {sources.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setOpenSources(
                    (previous) => !previous
                  )
                }
              >
                ◫ Sources ({sources.length}){" "}
                {openSources ? "▴" : "▾"}
              </button>
            )}
          </div>
        )}

        {assistant &&
          openSources &&
          sources.length > 0 && (
            <div className="sg-evidence-panel">
              <div className="sg-evidence-title">
                <strong>Source Evidence</strong>

                <button
                  type="button"
                  onClick={() =>
                    setOpenSources(false)
                  }
                  aria-label="Close evidence"
                >
                  ×
                </button>
              </div>

              {sources.map((source, index) => (
                <div
                  key={`${source.citation_id}-${index}`}
                  className={`sg-evidence-card ${
                    selectedSource ===
                    source.citation_id
                      ? "sg-evidence-selected"
                      : ""
                  }`}
                >
                  <div className="sg-evidence-label">
                    <span>
                      [{source.citation_id}]
                    </span>

                    <strong>
                      {source.filename ||
                        "Source document"}
                    </strong>
                  </div>

                  <p>
                    {source.excerpt ||
                      "No excerpt available."}
                  </p>
                </div>
              ))}
            </div>
          )}
      </div>

      {!assistant && (
        <div className="sg-avatar sg-user-avatar">
          You
        </div>
      )}
    </article>
  );
}

// =====================================
// MAIN AI ASSISTANT
// =====================================

export default function AIAssistant() {
  const { token } = useAuth();

  const [conversations, setConversations] =
    useState([]);

  const [activeId, setActiveId] = useState(null);
  const [activeTitle, setActiveTitle] =
    useState("");

  const [messages, setMessages] = useState([]);
  const [documentInfo, setDocumentInfo] =
    useState(null);

  const [question, setQuestion] = useState("");

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] =
    useState(false);

  const [listLoading, setListLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [listening, setListening] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [previewOpen, setPreviewOpen] =
    useState(false);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [previewLoading, setPreviewLoading] =
    useState(false);

  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const pdfUrlRef = useRef(null);

  // NEW: Track which document owns the loaded PDF.
  const pdfDocumentIdRef = useRef(null);

  // NEW: Cancel outdated preview requests.
  const previewRequestRef = useRef(null);
  const previewVersionRef = useRef(0);

  // NEW: Prevent stale saved-chat responses.
  const chatRequestRef = useRef(0);

  // =====================================
  // RELEASE PDF RESOURCES
  // =====================================

  const releasePdf = () => {
    previewVersionRef.current += 1;

    if (previewRequestRef.current) {
      previewRequestRef.current.abort();
      previewRequestRef.current = null;
    }

    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
    }

    pdfUrlRef.current = null;
    pdfDocumentIdRef.current = null;

    setPdfUrl(null);
    setPreviewOpen(false);
    setPreviewLoading(false);
  };

  // =====================================
  // LOAD CONVERSATIONS
  // =====================================

  useEffect(() => {
    let alive = true;

    if (!token) {
      setConversations([]);
      setListLoading(false);
      return;
    }

    setListLoading(true);

    listConversations(token)
      .then((data) => {
        if (alive) {
          setConversations(getList(data));
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (alive) {
          setListLoading(false);
        }
      });

    return () => {
      alive = false;
      recognitionRef.current?.abort();
    };
  }, [token]);

  // =====================================
  // COMPONENT CLEANUP
  // =====================================

  useEffect(() => {
    return () => {
      previewRequestRef.current?.abort();

      if (pdfUrlRef.current) {
        URL.revokeObjectURL(
          pdfUrlRef.current
        );
      }
    };
  }, []);

  // =====================================
  // AUTO SCROLL
  // =====================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, busy]);

  // =====================================
  // REFRESH CONVERSATION LIST
  // =====================================

  const refreshList = async () => {
    const data = await listConversations(token);

    setConversations(getList(data));
  };

  // =====================================
  // START NEW CHAT
  // =====================================

  const startNew = () => {
    if (busy || uploading) return;

    chatRequestRef.current += 1;

    recognitionRef.current?.abort();

    releasePdf();

    setActiveId(null);
    setActiveTitle("");
    setMessages([]);
    setDocumentInfo(null);
    setQuestion("");
    setError("");
    setSidebarOpen(false);
  };

  // =====================================
  // OPEN SAVED CONVERSATION
  // =====================================

  const openChat = async (item) => {
    if (busy || uploading) return;

    const id = getId(item);

    if (!id) return;

    const requestId = ++chatRequestRef.current;

    setBusy(true);
    setError("");

    // Close the previous PDF.
    releasePdf();

    try {
      const data = await getConversation(
        id,
        token
      );

      if (requestId !== chatRequestRef.current) {
        return;
      }

      const conversation =
        data?.conversation || data;

      let doc = null;

      // NEW: Retrieve the original filename
      // from the authenticated metadata endpoint.
      if (conversation.document_id) {
        const documentId = String(
          conversation.document_id
        );

        let filename =
          conversation.document_filename ||
          "Uploaded document";

        let previewAvailable = false;

        try {
          const response = await fetch(
            `${DOCUMENT_API_BASE}/documents/${encodeURIComponent(
              documentId
            )}/metadata`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

          if (response.ok) {
            const metadata =
              await response.json();

            filename =
              metadata.filename || filename;

            previewAvailable =
              metadata.preview_available === true;
          } else {
            console.warn(
              "Document metadata unavailable:",
              response.status
            );
          }
        } catch (metadataError) {
          console.warn(
            "Could not load document metadata:",
            metadataError
          );
        }

        if (
          requestId !== chatRequestRef.current
        ) {
          return;
        }

        doc = {
          document_id: documentId,
          filename,
          preview_available:
            previewAvailable,
        };
      }

      setActiveId(id);

      setActiveTitle(
        conversation.title ||
          item.title ||
          ""
      );

      setDocumentInfo(doc);

      setMessages(
        withFirstAttachment(
          getMessages(conversation),
          doc
        )
      );

      setSidebarOpen(false);
    } catch (err) {
      if (
        requestId === chatRequestRef.current
      ) {
        setError(err.message);
      }
    } finally {
      if (
        requestId === chatRequestRef.current
      ) {
        setBusy(false);
      }
    }
  };

  // =====================================
  // AUTHENTICATED PDF PREVIEW
  // =====================================

  const openPreview = async (attachment) => {
    const documentId =
      attachment?.document_id;

    if (!documentId) {
      setError("Document ID is missing.");
      return;
    }

    if (!attachment?.isPdf) {
      setError(
        "Preview is currently available for PDF documents only."
      );
      return;
    }

    if (!token) {
      setError(
        "Please sign in to preview this document."
      );
      return;
    }

    const requestedId = String(documentId);

    // Reuse only if this URL belongs to
    // the requested document.
    if (
      pdfUrlRef.current &&
      pdfDocumentIdRef.current === requestedId
    ) {
      setPdfUrl(pdfUrlRef.current);
      setPreviewOpen(true);
      return;
    }

    // Cancel the previous preview request.
    previewRequestRef.current?.abort();

    const controller = new AbortController();

    previewRequestRef.current = controller;

    const requestVersion =
      ++previewVersionRef.current;

    setPreviewLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${DOCUMENT_API_BASE}/documents/${encodeURIComponent(
          requestedId
        )}/preview`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
          signal: controller.signal,
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view this PDF."
          );
        }

        if (response.status === 404) {
          throw new Error(
            errorData?.detail ||
              "Original PDF not found. Please re-upload it."
          );
        }

        throw new Error(
          errorData?.detail ||
            `PDF preview failed (${response.status}).`
        );
      }

      const blob = await response.blob();

      // Ignore responses from an old chat.
      if (
        controller.signal.aborted ||
        requestVersion !==
          previewVersionRef.current
      ) {
        return;
      }

      if (
        !blob.type
          .toLowerCase()
          .includes("application/pdf")
      ) {
        throw new Error(
          "The server did not return a PDF."
        );
      }

      if (blob.size === 0) {
        throw new Error(
          "The PDF file is empty."
        );
      }

      if (pdfUrlRef.current) {
        URL.revokeObjectURL(
          pdfUrlRef.current
        );
      }

      const url = URL.createObjectURL(blob);

      pdfUrlRef.current = url;
      pdfDocumentIdRef.current = requestedId;

      setPdfUrl(url);
      setPreviewOpen(true);
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      if (
        requestVersion ===
        previewVersionRef.current
      ) {
        setError(
          err.message ||
            "Unable to preview the PDF."
        );
      }
    } finally {
      if (
        previewRequestRef.current ===
        controller
      ) {
        previewRequestRef.current = null;
      }

      if (
        requestVersion ===
        previewVersionRef.current
      ) {
        setPreviewLoading(false);
      }
    }
  };

  // =====================================
  // SEND CHAT MESSAGE
  // =====================================

  const send = async (value = question) => {
    const text = String(value || "").trim();

    if (
      text.length < 2 ||
      busy ||
      uploading ||
      !token
    ) {
      return;
    }

    const previousMessages = messages;
    const doc = documentInfo;

    setBusy(true);
    setError("");
    setQuestion("");

    setMessages(
      withFirstAttachment(
        [
          ...messages,
          {
            role: "user",
            content: text,
          },
        ],
        doc
      )
    );

    try {
      let id = activeId;
      const docId =
        doc?.document_id || null;

      if (!id) {
        const title = text.slice(0, 80);

        const created =
          await createConversation(
            {
              title,
              document_id: docId,
            },
            token
          );

        id = getId(
          created?.conversation || created
        );

        if (!id) {
          throw new Error(
            "Conversation ID was not returned."
          );
        }

        setActiveId(id);
        setActiveTitle(title);
      }

      const data =
        await sendConversationMessage(
          id,
          {
            question: text,
            limit: 5,
            document_id: docId,
          },
          token
        );

      const response = data?.response;

      if (!response) {
        throw new Error(
          "No chat response was returned."
        );
      }

      if (
        Array.isArray(
          data?.conversation?.messages
        )
      ) {
        const next = [
          ...data.conversation.messages,
        ];

        const lastAssistantIndex =
          next.findLastIndex(
            (message) =>
              message.role === "assistant"
          );

        if (lastAssistantIndex >= 0) {
          next[lastAssistantIndex] = {
            ...next[lastAssistantIndex],
            content: response.answer,
            answer_blocked:
              response.answer_blocked,
            verification_status:
              response.verification_status,
            verification_method:
              response.verification_method,
            verification_model:
              response.verification_model,
            verified_claims:
              response.verified_claims || [],
            sources: response.sources || [],
          };
        }

        setMessages(
          withFirstAttachment(next, doc)
        );
      } else {
        setMessages((previous) => [
          ...previous,
          {
            ...response,
            role: "assistant",
            content: response.answer,
          },
        ]);
      }

      try {
        await refreshList();
      } catch {
        // Preserve the answer if list refresh fails.
      }
    } catch (err) {
      setError(err.message);
      setMessages(previousMessages);
      setQuestion(text);
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // DOCUMENT UPLOAD
  // =====================================

  const handleUpload = async (file) => {
    if (!file || busy || uploading) return;

    if (activeId || messages.length > 0) {
      setError(
        "Please start a New Chat before attaching another document."
      );
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await uploadDocument(
        file,
        token
      );

      const doc = result?.document || result;

      const id =
        doc?.document_id ||
        doc?._id ||
        doc?.id;

      if (!id) {
        throw new Error(
          "Document ID was not returned."
        );
      }

      releasePdf();

      setDocumentInfo({
        document_id: String(id),
        filename: doc.filename || file.name,
        preview_available:
          doc.preview_available === true,
      });

      // Keep local preview immediately after upload.
      // Saved chats can retrieve the same PDF from
      // the authenticated backend endpoint.
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        const url = URL.createObjectURL(file);

        pdfUrlRef.current = url;
        pdfDocumentIdRef.current = String(id);

        setPdfUrl(url);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  // =====================================
  // RENAME CONVERSATION
  // =====================================

  const handleRename = async (item) => {
    const id = getId(item);

    const title = window.prompt(
      "Rename conversation",
      item.title || "New Chat"
    );

    if (!id || !title?.trim()) return;

    try {
      await renameConversation(
        id,
        title.trim(),
        token
      );

      if (id === activeId) {
        setActiveTitle(title.trim());
      }

      await refreshList();
    } catch (err) {
      setError(err.message);
    }
  };

  // =====================================
  // DELETE CONVERSATION
  // =====================================

  const handleDelete = async (item) => {
    const id = getId(item);

    if (
      !id ||
      !window.confirm(
        "Delete this conversation?"
      )
    ) {
      return;
    }

    try {
      await deleteConversation(id, token);

      if (id === activeId) {
        startNew();
      }

      await refreshList();
    } catch (err) {
      setError(err.message);
    }
  };

  // =====================================
  // VOICE RECOGNITION
  // =====================================

  const voice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    if (!window.isSecureContext) {
      setError(
        "Voice input requires HTTPS or localhost."
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Use Chrome or Edge for speech recognition."
      );
      return;
    }

    try {
      recognitionRef.current?.abort();

      const recognition =
        new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      const initialText = question.trim();

      recognition.onstart = () => {
        setListening(true);
        setError("");
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(
          event.results
        )
          .map(
            (result) =>
              result[0]?.transcript || ""
          )
          .join(" ")
          .trim();

        setQuestion(
          [initialText, transcript]
            .filter(Boolean)
            .join(" ")
        );
      };

      recognition.onerror = (event) => {
        const errors = {
          "not-allowed":
            "Allow microphone access in browser settings.",
          "audio-capture":
            "No working microphone detected.",
          "no-speech":
            "No speech detected. Please try again.",
          network:
            "Speech recognition network error.",
          "service-not-allowed":
            "Speech recognition service is blocked.",
        };

        if (event.error !== "aborted") {
          setError(
            errors[event.error] ||
              `Microphone error: ${event.error}`
          );
        }

        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);

        if (
          recognitionRef.current ===
          recognition
        ) {
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setListening(false);
      setError(err.message);
    }
  };

  // =====================================
  // MAIN UI
  // =====================================

  return (
    <div className="sg-chat-shell">
      {sidebarOpen && (
        <button
          className="sg-sidebar-backdrop"
          aria-label="Close conversations"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside
        className={`sg-chat-sidebar ${
          sidebarOpen
            ? "sg-sidebar-open"
            : ""
        }`}
      >
        <div className="sg-sidebar-top">
          <strong>Conversations</strong>

          <button
            onClick={startNew}
            disabled={busy || uploading}
          >
            ＋ New
          </button>
        </div>

        {listLoading && (
          <p className="sg-muted">
            Loading conversations...
          </p>
        )}

        {!listLoading &&
          conversations.length === 0 && (
            <p className="sg-muted">
              No conversations yet.
            </p>
          )}

        <div className="sg-conversation-list">
          {conversations.map((item) => {
            const id = getId(item);

            return (
              <div
                key={id}
                className={`sg-conversation ${
                  activeId === id
                    ? "selected"
                    : ""
                }`}
              >
                <button
                  className="sg-conversation-title"
                  title={item.title}
                  onClick={() =>
                    openChat(item)
                  }
                  disabled={busy}
                >
                  {item.title || "New Chat"}
                </button>

                <button
                  title="Rename"
                  aria-label="Rename conversation"
                  onClick={() =>
                    handleRename(item)
                  }
                  disabled={busy}
                >
                  ✎
                </button>

                <button
                  title="Delete"
                  aria-label="Delete conversation"
                  onClick={() =>
                    handleDelete(item)
                  }
                  disabled={busy}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* =====================================
          MAIN CHAT
      ===================================== */}

      <section className="sg-chat-main">
        <header className="sg-chat-header">
          <div className="sg-header-title">
            <button
              className="sg-mobile-menu"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Open conversations"
            >
              ☰
            </button>

            <div className="sg-header-symbol">
              ⚓
            </div>

            <div>
              <h1>SeaGuard AI Assistant</h1>

              <p>
                Maritime intelligence ·
                Evidence-grounded answers
              </p>
            </div>
          </div>

          <div className="sg-header-actions">
            {messages.length > 0 && (
              <button
                className="sg-download-btn"
                onClick={() =>
                  exportConversation(
                    activeTitle,
                    messages
                  )
                }
                title="Download conversation"
              >
                ↓ Export
              </button>
            )}

            <span className="sg-header-pill">
              <span className="sg-live-dot" />
              AI Assistant
            </span>
          </div>
        </header>

        {/* =====================================
            ERROR MESSAGE
        ===================================== */}

        {error && (
          <div
            className="sg-error"
            role="alert"
          >
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* =====================================
            CHAT CONTENT
        ===================================== */}

        <div className="sg-chat-content">
          <div className="sg-chat-stream">
            {/* Welcome screen */}

            {messages.length === 0 &&
              !documentInfo && (
                <div className="sg-welcome">
                  <div className="sg-welcome-icon">
                    ⚓
                  </div>

                  <div className="sg-welcome-eyebrow">
                    YOUR MARITIME COPILOT
                  </div>

                  <h2>
                    How can I help you
                    navigate safely?
                  </h2>

                  <p>
                    Ask about maritime safety,
                    security incidents,
                    compliance, or an
                    uploaded document.
                  </p>

                  <div className="sg-quick-grid">
                    {QUICK.map((item) => (
                      <button
                        key={item}
                        onClick={() =>
                          send(item)
                        }
                        disabled={
                          busy || uploading
                        }
                      >
                        {item} ↗
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* =====================================
                UPLOADED DOCUMENT BEFORE QUESTION
            ===================================== */}

            {messages.length === 0 &&
              documentInfo && (
                <div className="sg-message sg-user">
                  <div className="sg-message-body">
                    <div className="sg-message-head">
                      <strong>
                        Attached document
                      </strong>
                    </div>

                    <AttachmentCard
                      attachment={{
                        ...documentInfo,
                        isPdf:
                          documentInfo.filename
                            ?.toLowerCase()
                            .endsWith(".pdf"),
                      }}
                      onPreview={openPreview}
                    />

                    <div className="sg-message-text">
                      Document uploaded.
                      Ask a question about it.
                    </div>
                  </div>

                  <div className="sg-avatar sg-user-avatar">
                    You
                  </div>
                </div>
              )}

            {/* =====================================
                CONVERSATION MESSAGES
            ===================================== */}

            {messages.map(
              (message, index) => (
                <Message
                  key={
                    message._id ||
                    index
                  }
                  message={message}
                  onPreview={openPreview}
                />
              )
            )}

            {busy && (
              <div className="sg-thinking">
                SeaGuard AI is processing
                your request...
              </div>
            )}

            {previewLoading && (
              <div className="sg-thinking">
                Loading PDF preview...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* =====================================
              PDF PREVIEW PANEL
          ===================================== */}

          {previewOpen && pdfUrl && (
            <aside className="sg-pdf-preview">
              <div className="sg-preview-header">
                <div>
                  <strong>
                    Document Preview
                  </strong>

                  <small>
                    {documentInfo?.filename}
                  </small>
                </div>

                <button
                  onClick={() =>
                    setPreviewOpen(false)
                  }
                  aria-label="Close PDF preview"
                >
                  ×
                </button>
              </div>

              <iframe
                title="Uploaded PDF Preview"
                src={pdfUrl}
                className="sg-pdf-frame"
              />
            </aside>
          )}
        </div>

        {/* =====================================
            MESSAGE COMPOSER
        ===================================== */}

        <div className="sg-compose-area">
          <div className="sg-composer">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.jpg,.jpeg,.png"
              hidden
              onChange={(event) =>
                handleUpload(
                  event.target.files?.[0]
                )
              }
            />

            <button
              title="Attach document"
              onClick={() =>
                fileRef.current?.click()
              }
              disabled={
                busy ||
                uploading ||
                !!activeId ||
                messages.length > 0
              }
            >
              📎
            </button>

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              placeholder={
                documentInfo
                  ? "Ask about this document..."
                  : "Ask SeaGuard AI anything..."
              }
              rows={2}
              maxLength={3000}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent
                    .isComposing
                ) {
                  event.preventDefault();
                  send();
                }
              }}
            />

            <button
              className={
                listening
                  ? "sg-mic-active"
                  : ""
              }
              onClick={voice}
              disabled={busy || uploading}
              title={
                listening
                  ? "Stop listening"
                  : "Voice input"
              }
              aria-label={
                listening
                  ? "Stop listening"
                  : "Voice input"
              }
              aria-pressed={listening}
            >
              {listening ? "■" : "🎙"}
            </button>

            <button
              className="sg-send"
              onClick={() => send()}
              disabled={
                busy ||
                uploading ||
                question.trim().length < 2
              }
              title="Send message"
            >
              {busy ? "…" : "➤"}
            </button>
          </div>

          {listening && (
            <p className="sg-listening">
              ● Listening… Speak now.
            </p>
          )}

          <p className="sg-disclaimer">
            SeaGuard AI is decision support,
            not a substitute for approved
            vessel procedures or a qualified
            maritime officer.
          </p>
        </div>
      </section>
    </div>
  );
}
