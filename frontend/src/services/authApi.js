
const API_BASE_URL = "http://127.0.0.1:8000";

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = "Something went wrong.";

    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail
        .map((item) => item.msg || "Validation error")
        .join(", ");
    }

    throw new Error(message);
  }

  return data;
}

function getAuthToken() {
  const token = localStorage.getItem("seaguard_token");

  if (!token) {
    throw new Error(
      "Authentication required. Please log in again."
    );
  }

  return token;
}

async function authenticatedRequest(path, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

// ==========================================
// PUBLIC REGISTRATION
// ==========================================

export async function registerUser(userData) {
  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
      }),
    }
  );

  return handleResponse(response);
}

// ==========================================
// LOGIN
// ==========================================

export async function loginUser(username, password) {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  return handleResponse(response);
}

// ==========================================
// CURRENT USER PROFILE
// ==========================================

export async function getMyProfile(token) {
  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}

// ==========================================
// ROLE ACCESS CHECKS
// ==========================================

export async function checkOfficerAccess(token) {
  const response = await fetch(
    `${API_BASE_URL}/auth/officer`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}

export async function checkAdminAccess(token) {
  const response = await fetch(
    `${API_BASE_URL}/auth/admin`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}

// ==========================================
// OFFICER AREA
// ==========================================

export async function getOfficerArea() {
  return authenticatedRequest("/auth/officer", {
    method: "GET",
  });
}

// ==========================================
// ADMIN AREA
// ==========================================

export async function getAdminArea() {
  return authenticatedRequest("/auth/admin", {
    method: "GET",
  });
}

// ==========================================
// ADMIN - LIST ALL USERS
// ==========================================

export async function getAllUsers() {
  return authenticatedRequest("/auth/users", {
    method: "GET",
  });
}

// ==========================================
// ADMIN - UPDATE USER ROLE
// ==========================================

export async function updateUserRole(username, role) {
  return authenticatedRequest(
    `/auth/users/${encodeURIComponent(username)}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }
  );
}

// ==========================================
// ADMIN - ACTIVATE / DEACTIVATE USER
// ==========================================

export async function updateUserStatus(
  username,
  isActive
) {
  return authenticatedRequest(
    `/auth/users/${encodeURIComponent(username)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_active: isActive,
      }),
    }
  );
}

export async function getAuditLogs(limit = 100) {
  const token = localStorage.getItem("seaguard_token");

  if (!token) {
    throw new Error("Authentication required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/audit-logs?limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}

// ==========================================
// ADMIN - CREATE OFFICER / ADMIN INVITATION
// ==========================================

export async function createUserInvitation(userData) {
  return authenticatedRequest("/auth/admin/invitations", {
    method: "POST",
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      role: userData.role,
    }),
  });
}

// ==========================================
// ADMIN - RESEND USER INVITATION
// ==========================================

export async function resendUserInvitation(username) {
  return authenticatedRequest(
    `/auth/admin/invitations/${encodeURIComponent(username)}/resend`,
    {
      method: "POST",
    }
  );
}

// ==========================================
// PUBLIC - ACCEPT INVITATION
// ==========================================

export async function acceptUserInvitation(token, password) {
  const response = await fetch(
    `${API_BASE_URL}/auth/accept-invitation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        new_password: password,
      }),
    }
  );

  return handleResponse(response);
}