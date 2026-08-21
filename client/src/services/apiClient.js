import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// In-memory only — never persisted to localStorage. Living in JS memory means a
// full page reload requires a silent refresh, which is the trade-off we accept
// for keeping the token out of reach of XSS-readable storage.
let accessToken = null;
let onUnauthorized = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/** Called by AuthContext so the client can react (e.g. redirect to /login) when a session can't be refreshed. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const status = response?.status;
    const code = response?.data?.error?.code;
    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register');

    if (status === 401 && code === 'LOGIN_REQUIRED' && !config._retried && !isAuthEndpoint) {
      config._retried = true;

      try {
        // Coalesce concurrent 401s into a single refresh call instead of a stampede.
        if (!refreshPromise) {
          refreshPromise = apiClient.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        const refreshResponse = await refreshPromise;
        setAccessToken(refreshResponse.data.data.accessToken);
        config.headers.Authorization = `Bearer ${refreshResponse.data.data.accessToken}`;
        return apiClient(config);
      } catch {
        setAccessToken(null);
        onUnauthorized();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
