"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { apiGet, tokenStore } from "@/lib/api";
import type { Me } from "@/lib/types";

interface AuthContextValue {
  user: Me | null;
  status: "loading" | "authed" | "anon";
  setSession: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<Me | null>(null);
  const [status, setStatus] = React.useState<AuthContextValue["status"]>("loading");

  const loadMe = React.useCallback(async () => {
    try {
      const me = await apiGet<Me>("/users/me");
      setUser(me);
      setStatus("authed");
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus("anon");
    }
  }, []);

  React.useEffect(() => {
    if (tokenStore.access) {
      void loadMe();
    } else {
      setStatus("anon");
    }
  }, [loadMe]);

  const setSession = React.useCallback(
    async (access: string, refresh: string) => {
      tokenStore.set(access, refresh);
      await loadMe();
    },
    [loadMe],
  );

  const logout = React.useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("anon");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, setSession, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Redirect to /login if not authenticated. Returns the auth state for convenience. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  React.useEffect(() => {
    if (auth.status === "anon") router.replace("/login");
  }, [auth.status, router]);
  return auth;
}
