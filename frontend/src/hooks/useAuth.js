import { useState, useEffect, useCallback } from 'react';
import { API, getAuthToken, setAuthToken, clearAuthToken } from '../services/api.js';

/**
 * Custom hook to manage authentication session, current user state,
 * and login/logout lifecycle.
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh profile from backend
  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await API.getMe();
      if (res?.user) {
        setCurrentUser(res.user);
        return res.user;
      }
      return null;
    } catch {
      clearAuthToken();
      setCurrentUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (token, user) => {
    setAuthToken(token);
    setCurrentUser(user);
  };

  const logout = () => {
    clearAuthToken();
    setCurrentUser(null);
  };

  return {
    currentUser,
    setCurrentUser,
    loading,
    refreshUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    isOrganizer: currentUser?.role === 'Organizer',
    isAdmin: currentUser?.role === 'Admin',
  };
}

export default useAuth;
