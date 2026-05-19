const _rawApiUrl =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://kable-career-admin.onrender.com' : 'http://localhost:5000');
export const API_URL = String(_rawApiUrl).trim().replace(/\/+$/, '');
const AUTH_KEY = 'kable_admin_user';

function messageForAuthFailure(res, data, fallbacks) {
  if (data?.message) return data.message;
  if (res.status === 404) {
    return 'Not found (404). The browser is not reaching the admin API. Set REACT_APP_API_URL to your Node backend base URL (e.g. your Render Web Service) when building the app, ensure the backend is deployed with /api/auth routes, and that the URL has no trailing slash.';
  }
  if (res.status === 401 && fallbacks.unauthorized) return fallbacks.unauthorized;
  return fallbacks.default;
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/** Backend 401 messages that mean the JWT is unusable (not e.g. wrong current password). */
const SESSION_LOST_MESSAGES = new Set([
  'Invalid or expired token',
  'Session expired. Please log in again.',
  'Invalid session. Please log in again.',
  'Authentication required',
]);

export function invalidateSessionIfUnauthorized(status, message) {
  if (status !== 401 || !message || typeof message !== 'string') return;
  if (!SESSION_LOST_MESSAGES.has(message)) return;
  clearStoredAuth();
  try {
    window.dispatchEvent(new CustomEvent('kable-admin-session-lost'));
  } catch (_) {
    /* non-browser */
  }
}

export function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const auth = getStoredAuth();
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
  return headers;
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = messageForAuthFailure(res, data, {
      unauthorized: 'Invalid email or password. If you just created the user, use the temporary password.',
      default: 'Login failed',
    });
    throw new Error(msg);
  }
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    invalidateSessionIfUnauthorized(res.status, data?.message);
    const msg = messageForAuthFailure(res, data, {
      unauthorized: 'Session expired or invalid. Please log in again.',
      default: 'Failed to change password',
    });
    throw new Error(msg);
  }
  return data;
}

export async function createUser(email, password, role = 'admin', cohortId = null) {
  const body = { email, password, role };
  if (role === 'student' && cohortId) body.cohortId = cohortId;
  const res = await fetch(`${API_URL}/api/auth/create-user`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    invalidateSessionIfUnauthorized(res.status, data?.message);
    throw new Error(data.message || 'Failed to create user');
  }
  return data;
}

export async function resetPassword(email, newPassword) {
  const res = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    invalidateSessionIfUnauthorized(res.status, data?.message);
    throw new Error(data.message || 'Failed to reset password');
  }
  return data;
}
