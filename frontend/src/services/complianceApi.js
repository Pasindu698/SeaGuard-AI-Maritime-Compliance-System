
const API_BASE_URL = "http://127.0.0.1:8000";

async function sendComplianceRequest(endpoint, payload, token) {
  if (!token) {
    throw new Error("Please log in to access Compliance services.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = "Unable to process the request.";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (response.status === 401) {
      message = "Session expired. Please log in again.";
    } else if (response.status === 403) {
      message = "You do not have permission to access this service.";
    } else if (response.status === 422) {
      message = "Please check your input and try again.";
    }

    throw new Error(message);
  }

  return data;
}

export async function searchCompliance(query, token, limit = 5) {
  return sendComplianceRequest(
    "/compliance/search",
    {
      query: query.trim(),
      limit,
    },
    token
  );
}

export async function checkCompliance(
  incidentDescription,
  token,
  limit = 5
) {
  return sendComplianceRequest(
    "/compliance/check",
    {
      incident_description: incidentDescription.trim(),
      limit,
    },
    token
  );
}


export async function fetchOriginalDocument(source, token) {
  if (!token) {
    throw new Error("Please log in to preview documents.");
  }

  if (!source || typeof source !== "string") {
    throw new Error("Invalid document source.");
  }

  // Encode each path segment while preserving folder separators.
  const encodedPath = source
    .replaceAll("\\", "/")
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const response = await fetch(
    `${API_BASE_URL}/compliance/documents/${encodedPath}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = "Unable to load the original document.";

    if (response.status === 401) {
      message = "Session expired. Please log in again.";
    } else if (response.status === 403) {
      message = "You do not have permission to view this document.";
    } else if (response.status === 404) {
      message = "Original document was not found.";
    }

    throw new Error(message);
  }

  return response.blob();
}
