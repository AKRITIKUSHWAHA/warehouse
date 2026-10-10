/**
 * API Configuration & Base Fetch Client for VI Customs Backend
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? '/api/v1' : 'http://127.0.0.1:5000/api/v1');
export const TOKEN_STORAGE_KEY = 'kers_token';

/**
 * Get current stored JWT token
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('kers_auth_token') || sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Save JWT token
 */
export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

/**
 * Standard fetch wrapper for Backend API with JWT injection, auto-reauth & error handling
 */
export async function apiFetch(endpoint, options = {}, isRetry = false) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // If 401 Unauthorized, automatically refresh session once using active user session and retry
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/switch-user') && typeof window !== 'undefined') {
      try {
        const activeUserStr = localStorage.getItem('kers_active_user');
        const activeUser = activeUserStr ? JSON.parse(activeUserStr) : null;
        if (activeUser?.id || activeUser?.email) {
          const switchRes = await fetch(`${API_BASE_URL}/auth/switch-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: activeUser.id, email: activeUser.email })
          });
          const switchData = await switchRes.json();
          const freshToken = switchData?.data?.token;
          if (freshToken) {
            setAuthToken(freshToken);
            return apiFetch(endpoint, options, true);
          }
        }
      } catch (reAuthErr) {
        // proceed to normal error parsing below
      }
    }

    // Parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errorMsg = data?.message || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const netError = new Error('Unable to reach Backend API server. Please check if backend is running on port 5001.');
      netError.status = 0;
      netError.isNetworkError = true;
      throw netError;
    }
    throw err;
  }
}
