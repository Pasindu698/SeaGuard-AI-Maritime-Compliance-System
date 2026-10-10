
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

async function parseResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : response.status === 401
        ? "Session expired. Please log in again."
        : response.status === 403
        ? "You do not have permission to access this service."
        : response.status === 422
        ? "Please check your incident details."
        : "Unable to coordinate the incident.";

    throw new Error(message);
  }

  return data;
}

export async function coordinateIncident(
  incidentDescription,
  limit = 5,
  token = null,
  documentId = null
) {
  if (!token) {
    throw new Error("Please log in before analyzing an incident.");
  }

  const payload = {
    incident_description: incidentDescription.trim(),
    limit,
  };

  if (documentId) {
    payload.document_id = documentId;
  }

  const response = await fetch(
    `${API_BASE_URL}/coordinator/coordinate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  return parseResponse(response);
}

export async function getCoordinatorInfo(token = null) {
  if (!token) {
    throw new Error("Please log in first.");
  }

  const response = await fetch(
    `${API_BASE_URL}/coordinator/info`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return parseResponse(response);
}
