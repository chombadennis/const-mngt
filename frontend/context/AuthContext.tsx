"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load from localStorage
    const savedToken = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("user");
    const savedRefresh = localStorage.getItem("refreshToken");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    if (savedRefresh) {
      setRefreshToken(savedRefresh);
    }
  }, []);

  const login = (jwt: string, userData: User) => {
    setToken(jwt);
    setUser(userData);
    // refreshToken may have been saved by loginUser (api.ts). Read it from localStorage.
    const savedRefresh = localStorage.getItem("refreshToken");
    setRefreshToken(savedRefresh);
    localStorage.setItem("accessToken", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    router.push("/dashboard");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const hasRole = (role: string) => {
    return (user?.is_superuser || user?.roles.includes(role)) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useRoles() {
  const { user } = useAuth();
  return user?.roles || [];
}

export function useIsAdmin() {
  const { hasRole } = useAuth();
  return hasRole("Admin");
}

export function useIsPM() {
  const { hasRole } = useAuth();
  return hasRole("PM");
}

export function useIsWorker() {
  const { hasRole } = useAuth();
  return hasRole("Worker");
}
