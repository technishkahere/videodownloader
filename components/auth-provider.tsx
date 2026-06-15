"use client";

import * as React from "react";
import {
  getMe,
  logIn,
  logOut,
  signUp,
  ApiError,
} from "@/lib/api-client";
import type { MeResponse, QuotaInfo, SessionUser } from "@/lib/types";

interface AuthContextValue {
  user: SessionUser | null;
  quota: QuotaInfo | null;
  loading: boolean;
  /** True once the first /api/auth/me has resolved. */
  ready: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    name?: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (data: MeResponse) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [quota, setQuota] = React.useState<QuotaInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [ready, setReady] = React.useState(false);

  const apply = React.useCallback((data: MeResponse) => {
    setUser(data.user);
    setQuota(data.quota);
  }, []);

  const refresh = React.useCallback(async () => {
    try {
      apply(await getMe());
    } catch {
      /* keep prior state on transient errors */
    } finally {
      setReady(true);
      setLoading(false);
    }
  }, [apply]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const u = await logIn({ email, password });
      setUser(u);
      await refresh(); // pull fresh quota for the account
    },
    [refresh]
  );

  const signup = React.useCallback(
    async (input: { name?: string; email: string; password: string }) => {
      const u = await signUp(input);
      setUser(u);
      await refresh();
    },
    [refresh]
  );

  const logout = React.useCallback(async () => {
    try {
      await logOut();
    } catch {
      /* best-effort; clear locally regardless */
    }
    setUser(null);
    await refresh();
  }, [refresh]);

  const value: AuthContextValue = {
    user,
    quota,
    loading,
    ready,
    refresh,
    login,
    signup,
    logout,
    setSession: apply,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export { ApiError };
