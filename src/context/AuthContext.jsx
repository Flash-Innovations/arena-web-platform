import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import arenaApi from '../api/arenaApi';

const AuthContext = createContext(null);

const SPECTATOR_LIMIT = 3;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'signin', // 'signin' | 'signup'
    title: '',
    message: ''
  });

  // Verify active session on load via HTTP-only cookie / backend verification
  const checkSession = useCallback(async () => {
    try {
      const res = await arenaApi.getMe();
      if (res && res.success && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem('arena_user', JSON.stringify(res.user));
        } catch (e) {}
      } else {
        setUser(null);
        try {
          localStorage.removeItem('arena_user');
        } catch (e) {}
      }
    } catch (err) {
      setUser(null);
      try {
        localStorage.removeItem('arena_user');
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const openAuthModal = useCallback(({ mode = 'signin', title = '', message = '' } = {}) => {
    setAuthModal({
      isOpen: true,
      mode,
      title,
      message
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const login = async (email, password) => {
    const data = await arenaApi.login({ email, password });
    if (data && data.user) {
      setUser(data.user);
      try {
        localStorage.setItem('arena_user', JSON.stringify(data.user));
      } catch (e) {}
      closeAuthModal();
    }
    return data;
  };

  const register = async (userData) => {
    const data = await arenaApi.register(userData);
    if (data && data.user) {
      setUser(data.user);
      try {
        localStorage.setItem('arena_user', JSON.stringify(data.user));
      } catch (e) {}
      closeAuthModal();
    }
    return data;
  };

  const googleSignIn = async (credential) => {
    const data = await arenaApi.googleSignIn({ credential });
    if (data && data.user) {
      setUser(data.user);
      try {
        localStorage.setItem('arena_user', JSON.stringify(data.user));
      } catch (e) {}
      closeAuthModal();
    }
    return data;
  };

  const googleRegister = async (userData) => {
    const data = await arenaApi.googleRegister(userData);
    if (data && data.user) {
      setUser(data.user);
      try {
        localStorage.setItem('arena_user', JSON.stringify(data.user));
      } catch (e) {}
      closeAuthModal();
    }
    return data;
  };

  const logout = async () => {
    try {
      await arenaApi.logout();
    } catch (e) {}
    setUser(null);
    try {
      localStorage.removeItem('arena_user');
    } catch (e) {}
  };

  // Spectator limit check
  const getSpectatorQuota = useCallback(() => {
    if (user) {
      return { spectatedCount: 0, limit: SPECTATOR_LIMIT, remaining: Infinity, isUnlimited: true };
    }
    try {
      const stored = JSON.parse(localStorage.getItem('arena_spectated_matches') || '[]');
      const count = Array.isArray(stored) ? stored.length : 0;
      return {
        spectatedCount: count,
        limit: SPECTATOR_LIMIT,
        remaining: Math.max(0, SPECTATOR_LIMIT - count),
        isUnlimited: false
      };
    } catch (e) {
      return { spectatedCount: 0, limit: SPECTATOR_LIMIT, remaining: SPECTATOR_LIMIT, isUnlimited: false };
    }
  }, [user]);

  const canSpectateMatch = useCallback((roomCode) => {
    if (user) return true;

    try {
      const stored = JSON.parse(localStorage.getItem('arena_spectated_matches') || '[]');
      const list = Array.isArray(stored) ? stored : [];

      if (list.includes(roomCode)) {
        return true;
      }

      if (list.length < SPECTATOR_LIMIT) {
        list.push(roomCode);
        localStorage.setItem('arena_spectated_matches', JSON.stringify(list));
        return true;
      }

      // Over limit
      openAuthModal({
        mode: 'signin',
        title: 'Guest Spectator Limit Reached',
        message: 'You have watched 3 free matches on this device. Sign in or create a free account to continue spectating live arena battles.'
      });
      return false;
    } catch (e) {
      return true;
    }
  }, [user, openAuthModal]);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    authModal,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    googleSignIn,
    googleRegister,
    logout,
    checkSession,
    getSpectatorQuota,
    canSpectateMatch
  }), [
    user,
    loading,
    authModal,
    openAuthModal,
    closeAuthModal,
    checkSession,
    getSpectatorQuota,
    canSpectateMatch
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
