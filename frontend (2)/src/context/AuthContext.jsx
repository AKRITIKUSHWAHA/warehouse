import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialUsers, initialRolesPermissions } from '../data/mock/usersData';
import { getStored, setStored, KEYS, initializeStorage } from '../services/storageService';
import { apiClient } from '../services/apiClient';
import { setAuthToken } from '../services/apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usersList, setUsersList] = useState(() => {
    initializeStorage();
    return getStored(KEYS.USERS, initialUsers);
  });

  const syncUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('users');
      if (res && res.data) {
        const backendUsers = Array.isArray(res.data) ? res.data : (res.data.items || res.data.users || []);
        if (backendUsers.length > 0) {
          setUsersList(backendUsers);
          return;
        }
      }
    } catch {
      // Fallback to storage or initial
    }
    setUsersList(getStored(KEYS.USERS, initialUsers));
  }, []);

  const [currentUser, setCurrentUser] = useState(() => {
    const isAuth = localStorage.getItem('kers_is_authenticated') === 'true';
    const token = localStorage.getItem('kers_token') || localStorage.getItem('kers_jwt_token');
    const saved = localStorage.getItem('kers_active_user');
    if (isAuth && token && saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const isAuth = localStorage.getItem('kers_is_authenticated') === 'true';
    const token = localStorage.getItem('kers_token') || localStorage.getItem('kers_jwt_token');
    const saved = localStorage.getItem('kers_active_user');
    return !!(isAuth && token && saved);
  });

  const persistToken = (token) => {
    if (token) {
      localStorage.setItem('kers_token', token);
      localStorage.setItem('kers_jwt_token', token);
      apiClient.setToken(token);
    } else {
      localStorage.removeItem('kers_token');
      localStorage.removeItem('kers_jwt_token');
      apiClient.setToken(null);
    }
  };

  // Validate server session on initial mount if token exists
  useEffect(() => {
    const checkServerSession = async () => {
      const token = localStorage.getItem('kers_token') || localStorage.getItem('kers_jwt_token');
      if (!token) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }

      persistToken(token);

      try {
        const res = await apiClient.get('/auth/me');
        if (res && res.data) {
          const user = res.data.user || res.data;
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('kers_active_user', JSON.stringify(user));
          localStorage.setItem('kers_is_authenticated', 'true');
        }
      } catch (err) {
        if (err?.status === 401 || err?.response?.status === 401) {
          console.warn('[AuthContext] Stored token is invalid or expired. Resetting session.');
          persistToken(null);
          localStorage.removeItem('kers_is_authenticated');
          localStorage.removeItem('kers_active_user');
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    checkServerSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kers_active_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const login = async (emailOrId, password = 'password123') => {
    const allUsers = getStored(KEYS.USERS, initialUsers);
    let targetUser = allUsers.find(
      u => u.id === emailOrId || u.email?.toLowerCase() === String(emailOrId).toLowerCase()
    );

    const email = targetUser?.email || (String(emailOrId).includes('@') ? emailOrId : 'carlos.m@vicustoms.com');
    const pwd = password || 'password123';

    try {
      const res = await apiClient.post('/auth/login', { email, password: pwd });
      const authResult = res?.data || res;
      if (authResult && authResult.token) {
        persistToken(authResult.token);
        const loggedUser = authResult.user || targetUser;
        setCurrentUser(loggedUser);
        setIsAuthenticated(true);
        localStorage.setItem('kers_is_authenticated', 'true');
        localStorage.setItem('kers_active_user', JSON.stringify(loggedUser));
        return loggedUser;
      }
    } catch (err) {
      console.warn('[AuthContext] Login notice:', err.message);
    }

    // Local fallback for offline/demo resilience
    const fallbackUser = targetUser || allUsers[0] || initialUsers[0];
    persistToken('local-session-active');
    setCurrentUser(fallbackUser);
    setIsAuthenticated(true);
    localStorage.setItem('kers_is_authenticated', 'true');
    localStorage.setItem('kers_active_user', JSON.stringify(fallbackUser));
    return fallbackUser;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignored
    }
    persistToken(null);
    localStorage.removeItem('kers_is_authenticated');
    localStorage.removeItem('kers_active_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/login');
    }
  };

  const switchUser = async (userId) => {
    const allUsers = getStored(KEYS.USERS, initialUsers);
    const found = allUsers.find(u => u.id === userId || u.userCode === userId || u.roleKey === userId);
    if (found) {
      await login(found.email, 'password123');
    }
  };

  const isAgent = currentUser?.roleKey === 'agent';
  const isSuperAdmin = currentUser?.roleKey === 'super_admin';
  const isOps = currentUser?.roleKey === 'operations' || isSuperAdmin;
  const isWarehouse = currentUser?.roleKey === 'warehouse';
  const isDocs = currentUser?.roleKey === 'documentation';

  const getRolePermissions = () => {
    const role = initialRolesPermissions.find(r => r.roleKey === currentUser?.roleKey);
    return role ? role.permissions : null;
  };

  const hasPermission = (module, action) => {
    if (isSuperAdmin) return true;
    const permissions = getRolePermissions();
    if (!permissions || !permissions[module]) return false;
    return !!permissions[module][action];
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      currentRole: currentUser?.roleKey || 'super_admin',
      isAuthenticated,
      isAgent,
      isSuperAdmin,
      isOps,
      isWarehouse,
      isDocs,
      usersList,
      rolesList: initialRolesPermissions,
      syncUsers,
      login,
      logout,
      switchUser,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
