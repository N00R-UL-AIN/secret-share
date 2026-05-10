// Authentication context and provider for managing user sessions
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";

const AuthContext = createContext(null);

// Authentication provider component
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("accessToken") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persist token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }, [token]);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth().finally(() => setLoading(false));
  }, []);

  async function initializeAuth() {
    if (!token) {
      // Try to refresh token if no access token
      const refreshed = await tryRefresh();
      if (!refreshed) return;
    }
    // Fetch current user data
    await fetchMe();
  }

  async function tryRefresh() {
    try {
      const response = await apiRequest("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setToken(response.data.accessToken || "");
      return true;
    } catch {
      setToken("");
      setUser(null);
      return false;
    }
  }

  async function fetchMe() {
    try {
      const response = await authedRequest("/api/auth/me");
      setUser(response.data.user || null);
      return response.data.user || null;
    } catch {
      setUser(null);
      return null;
    }
  }

  async function register(email, password) {
    await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async function login(email, password) {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(response.data.accessToken || "");
    setUser(response.data.user || null);
    return response.data.user || null;
  }

  async function logout() {
    try {
      await authedRequest("/api/auth/logout", { method: "POST" });
    } finally {
      setToken("");
      setUser(null);
    }
  }

  // Make authenticated API requests with automatic token refresh
  async function authedRequest(path, options = {}, hasRetried = false) {
    if (!token) {
      throw new Error("You are not authenticated.");
    }

    try {
      return await apiRequest(path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      if (error.status === 401 && !hasRetried) {
        // Token expired, try to refresh once
        const refreshed = await tryRefresh();
        if (refreshed) {
          return authedRequest(path, options, true);
        }
      }
      throw error;
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user && token),
      register,
      login,
      logout,
      fetchMe,
      authedRequest,
    }),
    [user, loading, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
