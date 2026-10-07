const API_BASE_URL = "http://127.0.0.1:8000";

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Document upload failed.");
  }

  return data;
}

export async function queryDocument(query) {
  const response = await fetch(`${API_BASE_URL}/documents/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Document query failed.");
  }

  return data;
}