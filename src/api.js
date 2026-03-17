const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://kable-career-adimn.onrender.com' : 'http://localhost:5001');
const AUTH_KEY = 'kable_admin_user';

export { API_URL };

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
    const msg = data.message || (res.status === 401 ? 'Invalid email or password. If you just created the user, use the temporary password.' : 'Login failed');
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
    const msg = data.message || (res.status === 401 ? 'Session expired or invalid. Please log in again.' : 'Failed to change password');
    throw new Error(msg);
  }
  return data;
}

export async function createUser(email, password, role = 'admin', cohortId = null) {
  const body = { email, password, role };
  if (role === 'student' && cohortId) body.cohortId = cohortId;
  const res = await fetch(`${API_URL}/api/auth/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to create user');
  return data;
}

export async function resetPassword(email, newPassword) {
  const res = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to reset password');
  return data;
}
