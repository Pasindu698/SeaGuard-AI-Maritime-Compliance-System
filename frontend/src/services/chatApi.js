const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request(path, token, options = {}) {
  if (!token) throw new Error('Please log in again.');
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : null;
    throw new Error(detail || (response.status === 401 ? 'Session expired. Please log in again.' : `Request failed (${response.status}).`));
  }
  return data;
}

export const listConversations = (token) => request('/chat/conversations', token);
export const getConversation = (id, token) => request(`/chat/conversations/${encodeURIComponent(id)}`, token);
export const createConversation = (payload, token) => request('/chat/conversations', token, { method: 'POST', body: JSON.stringify(payload) });
export const sendConversationMessage = (id, payload, token) => request(`/chat/conversations/${encodeURIComponent(id)}/messages`, token, { method: 'POST', body: JSON.stringify(payload) });
export const renameConversation = (id, title, token) => request(`/chat/conversations/${encodeURIComponent(id)}`, token, { method: 'PATCH', body: JSON.stringify({ title }) });
export const deleteConversation = (id, token) => request(`/chat/conversations/${encodeURIComponent(id)}`, token, { method: 'DELETE' });
