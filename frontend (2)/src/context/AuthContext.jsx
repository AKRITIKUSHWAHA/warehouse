import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialUsers, initialRolesPermissions } from '../data/mock/usersData';
import { getStored, setStored, KEYS, initializeStorage } from '../services/storageService';
import { apiClient } from '../services/apiClient';
import { setAuthToken } from '../services/apiConfig';
import {
  DEFAULT_ROLE_PERMISSIONS_MAP,
  SYSTEM_MODULES,
  getStoredPermissionsMap,
  saveStoredPermissionsMap,
  hasModulePermission
} from '../config/rolePermissions';

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

  const login = async (emailOrId, password) => {
    if (!password || !password.trim()) {
      throw new Error('Please enter your password.');
    }

    const allUsers = getStored(KEYS.USERS, initialUsers);
    let targetUser = allUsers.find(
      u => u.id === emailOrId || u.email?.toLowerCase() === String(emailOrId).toLowerCase()
    );

    const email = targetUser?.email || (String(emailOrId).includes('@') ? emailOrId : '');
    if (!email) {
      throw new Error('Please enter a valid email address.');
    }

    try {
      const res = await apiClient.post('/auth/login', { email, password: password.trim() });
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
      console.warn('[AuthContext] Login failed:', err.message);
      throw err;
    }

    throw new Error('Invalid email or password');
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
    const found = allUsers.find(
      u => u.id === userId || u.userCode === userId || u.roleKey === userId || u.email?.toLowerCase() === String(userId).toLowerCase()
    );

    if (!found) return null;

    try {
      const res = await apiClient.post('/auth/switch-user', {
        userId: found.id,
        email: found.email,
      });
      const authResult = res?.data || res;
      if (authResult && authResult.token) {
        persistToken(authResult.token);
        const loggedUser = authResult.user || found;
        setCurrentUser(loggedUser);
        setIsAuthenticated(true);
        localStorage.setItem('kers_is_authenticated', 'true');
        localStorage.setItem('kers_active_user', JSON.stringify(loggedUser));
        return loggedUser;
      }
    } catch (err) {
      console.warn('[AuthContext] /auth/switch-user notice, using local persona:', err.message);
    }

    // Fallback persona switch for offline / mock resilience
    persistToken('local-session-active');
    setCurrentUser(found);
    setIsAuthenticated(true);
    localStorage.setItem('kers_is_authenticated', 'true');
    localStorage.setItem('kers_active_user', JSON.stringify(found));
    return found;
  };

  const [rolePermissionsMap, setRolePermissionsMap] = useState(() => {
    return getStoredPermissionsMap();
  });

  // Sync role permissions from backend settings if available
  useEffect(() => {
    const fetchBackendPermissions = async () => {
      try {
        const res = await apiClient.get('settings/role_permissions');
        if (res && res.data && typeof res.data === 'object' && (res.data.value || res.data.super_admin)) {
          const remoteMap = res.data.value || res.data;
          setRolePermissionsMap(remoteMap);
          saveStoredPermissionsMap(remoteMap);
        }
      } catch {
        // Fallback to localStorage
      }
    };
    fetchBackendPermissions();
  }, []);

  const updateRolePermissionsMap = useCallback(async (newMap) => {
    setRolePermissionsMap(newMap);
    saveStoredPermissionsMap(newMap);
    try {
      await apiClient.put('settings/role_permissions', {
        value: newMap,
        description: 'Updated system role permissions matrix'
      });
    } catch (err) {
      console.warn('[AuthContext] Backend settings sync failed:', err.message);
    }
  }, []);

  const toggleRoleModule = useCallback(async (roleKey, moduleId) => {
    if (!roleKey || !moduleId) return;

    setRolePermissionsMap(prev => {
      const currentList = prev[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];
      let updatedList;
      if (currentList.includes(moduleId)) {
        // Protect super_admin from losing critical administrative modules
        if (roleKey === 'super_admin' && (moduleId === 'users' || moduleId === 'settings')) {
          return prev;
        }
        updatedList = currentList.filter(id => id !== moduleId);
      } else {
        updatedList = [...currentList, moduleId];
      }

      const nextMap = {
        ...prev,
        [roleKey]: updatedList
      };

      saveStoredPermissionsMap(nextMap);

      // Async persist to backend in background
      apiClient.put('settings/role_permissions', {
        value: nextMap,
        description: `Toggled module ${moduleId} for role ${roleKey}`
      }).catch(e => console.warn('[AuthContext] Persist error:', e));

      return nextMap;
    });
  }, []);

  const resetRolePermissions = useCallback(async () => {
    setRolePermissionsMap(DEFAULT_ROLE_PERMISSIONS_MAP);
    saveStoredPermissionsMap(DEFAULT_ROLE_PERMISSIONS_MAP);
    try {
      await apiClient.put('settings/role_permissions', {
        value: DEFAULT_ROLE_PERMISSIONS_MAP,
        description: 'Restored default role permissions matrix'
      });
    } catch (err) {
      console.warn('[AuthContext] Reset persist error:', err.message);
    }
  }, []);

  const isMenuAllowed = useCallback((roleKey, moduleIdOrTab) => {
    if (!roleKey) return false;
    if (roleKey === 'super_admin') return true;

    const allowedList = rolePermissionsMap[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];
    if (allowedList.includes('*') || allowedList.includes(moduleIdOrTab)) return true;

    // Check if matching module contains this tab
    const matched = SYSTEM_MODULES.find(m => m.id === moduleIdOrTab || (m.tabs && m.tabs.includes(moduleIdOrTab)));
    if (matched) {
      return allowedList.includes(matched.id);
    }
    return false;
  }, [rolePermissionsMap]);

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
      rolePermissionsMap,
      systemModules: SYSTEM_MODULES,
      updateRolePermissionsMap,
      toggleRoleModule,
      resetRolePermissions,
      isMenuAllowed,
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
