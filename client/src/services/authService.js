import { apiClient, setAccessToken } from './apiClient';

async function register({ name, email, password }) {
  const res = await apiClient.post('/auth/register', { name, email, password });
  setAccessToken(res.data.data.accessToken);
  return res.data.data.user;
}

async function login({ email, password }) {
  const res = await apiClient.post('/auth/login', { email, password });
  setAccessToken(res.data.data.accessToken);
  return res.data.data.user;
}

async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
}

/** Silent session restore on app load — relies on the httpOnly refresh cookie, not localStorage. */
async function restoreSession() {
  const refreshRes = await apiClient.post('/auth/refresh');
  setAccessToken(refreshRes.data.data.accessToken);
  const meRes = await apiClient.get('/auth/me');
  return meRes.data.data.user;
}

export const authService = { register, login, logout, restoreSession };
