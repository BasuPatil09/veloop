import { createContext, useCallback, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { setUnauthorizedHandler } from '../services/apiClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    let cancelled = false;

    authService
      .restoreSession()
      .then((restoredUser) => {
        if (!cancelled) setUser(restoredUser);
      })
      .catch(() => {
        // No valid session cookie yet — that's a normal state for a first-time visitor, not an error.
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (details) => {
    const newUser = await authService.register(details);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // Called right after a successful join (participationService) so the displayed
  // balance reflects the real server-side deduction immediately, instead of going
  // stale until the next login/refresh. currencyKey is 've' | 'sve' | 'token'.
  const updateBalance = useCallback((currencyKey, newBalance) => {
    setUser((prev) => (prev ? { ...prev, balances: { ...prev.balances, [currencyKey]: newBalance } } : prev));
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isInitializing,
    login,
    register,
    logout,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
