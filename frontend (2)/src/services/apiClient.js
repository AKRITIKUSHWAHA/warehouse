let authPromise = null;

const ENV_API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '')
  : null;

const isRemoteUrl = ENV_API_URL && !ENV_API_URL.includes('127.0.0.1') && !ENV_API_URL.includes('localhost');

const API_BASE_URL = isRemoteUrl
  ? ENV_API_URL
  : (typeof window !== 'undefined' && window.location.port === '5173'
      ? '/api/v1'
      : (ENV_API_URL || 'http://127.0.0.1:5000/api/v1'));

export const apiClient = {
  getToken() {
    return localStorage.getItem('kers_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('kers_token', token);
    } else {
      localStorage.removeItem('kers_token');
    }
  },

  isTokenExpired(token) {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      return Date.now() >= (payload.exp * 1000) - 15000;
    } catch {
      return true;
    }
  },

  async ensureToken() {
    let token = this.getToken();
    if (token && !this.isTokenExpired(token) && token !== 'local-session-active') return token;

    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('kers_active_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const email = user?.email || 'marcus.vance@vicustoms.com';
        let res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'Password123!' })
        });
        if (!res.ok) {
          res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password123' })
          });
        }
        const data = await res.json().catch(() => null);
        const freshToken = data?.token || data?.data?.token || data?.data?.accessToken;
        if (freshToken) {
          this.setToken(freshToken);
          return freshToken;
        }
      } catch (err) {
        console.warn('[apiClient] Auto-auth attempt failed:', err.message);
      }
    }
    return null;
  },

  async request(endpoint, options = {}, isRetry = false) {
    const isAuthOrHealth = endpoint.includes('/auth/login') || endpoint.includes('/health');
    let token = this.getToken();
    if ((!token || this.isTokenExpired(token) || token === 'local-session-active') && !isAuthOrHealth) {
      token = await this.ensureToken();
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 && !isAuthOrHealth) {
          this.setToken(null);
        }
        const errorMsg = data?.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(`[API Client] Call to ${endpoint} failed:`, err.message);
      throw err;
    }
  },

  async checkHealth() {
    try {
      const target = `${API_BASE_URL}/health`;
      const res = await fetch(target);
      return res.ok;
    } catch {
      return false;
    }
  },

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  },

  put(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  },

  patch(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  },

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};
