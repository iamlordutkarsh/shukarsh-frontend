"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getMe } from "./api";
import { createLocalStore } from "./local-store";
import type { User } from "./types";
import { useHydrated } from "./use-hydrated";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface Session {
  token: string | null;
  user: User | null;
}

const EMPTY_SESSION: Session = { token: null, user: null };
const store = createLocalStore<Session>("shukarsh-session", EMPTY_SESSION);

const LEGACY_TOKEN_KEY = "shukarsh-token";
const LEGACY_USER_KEY = "shukarsh-user";

/** Carries sessions saved before the session object was stored under one key. */
function migrateLegacySession() {
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacyToken) return;

  const legacyUser = localStorage.getItem(LEGACY_USER_KEY);
  let user: User | null = null;
  try {
    user = legacyUser ? (JSON.parse(legacyUser) as User) : null;
  } catch {
    user = null;
  }

  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  store.set({ token: legacyToken, user });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const hydrated = useHydrated();
  const [verified, setVerified] = useState(false);
  const token = session.token;

  useEffect(() => {
    if (!store.getSnapshot().token) migrateLegacySession();
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    store.set({ token: newToken, user: newUser });
  }, []);

  const logout = useCallback(() => store.set(EMPTY_SESSION), []);

  useEffect(() => {
    if (!token) return;
    let active = true;

    getMe(token)
      .then((data) => {
        if (active) store.set({ token, user: data.user });
      })
      .catch(() => {
        if (active) store.set(EMPTY_SESSION);
      })
      .finally(() => {
        if (active) setVerified(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      user: session.user,
      token,
      login,
      logout,
      loading: !hydrated || (Boolean(token) && !verified),
    }),
    [session.user, token, login, logout, verified, hydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
