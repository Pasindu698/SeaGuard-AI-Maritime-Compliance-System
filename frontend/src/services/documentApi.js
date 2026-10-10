
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

async function parseResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = "Document request failed.";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (response.status === 401) {
      message = "Session expired. Please log in again.";
    } else if (response.status === 403) {
      message = "You do not have access to this document.";
    } else if (response.status === 413) {
      message = "Document file is too large.";
    } else if (response.status === 422) {
      message = "Invalid document or query.";
    }

    throw new Error(message);
  }

  return data;
}

export async function uploadDocument(file, token) {
  if (!token) {
    throw new Error("Please log in before uploading documents.");
  }

  if (!file) {
    throw new Error("Please select a document.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/documents/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  return parseResponse(response);
}

export async function queryDocument(query, token) {
  if (!token) {
    throw new Error("Please log in before querying documents.");
  }

  if (!query?.trim()) {
    throw new Error("Please enter a question.");
  }

  const response = await fetch(
    `${API_BASE_URL}/documents/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: query.trim(),
      }),
    }
  );

  return parseResponse(response);
}
