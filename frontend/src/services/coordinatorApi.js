
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

export async function coordinateIncident(
  incidentDescription,
  limit = 5,
  token = null
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/coordinator/coordinate`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        incident_description: incidentDescription,
        limit,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data.detail === "string"
        ? data.detail
        : "Unable to coordinate the incident.";

    throw new Error(message);
  }

  return data;
}

export async function getCoordinatorInfo(token = null) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/coordinator/info`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load Coordinator Agent information."
    );
  }

  return response.json();
}
