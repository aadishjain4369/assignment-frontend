import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { loginRequest, registerRequest, type ApiUser } from '../api/client';

const STORAGE_KEY = 'webhook_dashboard_auth';

type Stored = { token: string; user: ApiUser };

function loadStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Stored;
    if (v?.token && v?.user?.id && v?.user?.email) return v;
    return null;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  token: string | null;
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadStored();
  const [token, setToken] = useState<string | null>(initial?.token ?? null);
  const [user, setUser] = useState<ApiUser | null>(initial?.user ?? null);
  const [loading, setLoading] = useState(false);

  const persist = useCallback((next: Stored | null) => {
    if (!next) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { token: t, user: u } = await loginRequest(email, password);
        setToken(t);
        setUser(u);
        persist({ token: t, user: u });
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { token: t, user: u } = await registerRequest(email, password);
        setToken(t);
        setUser(u);
        persist({ token: t, user: u });
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout }),
    [token, user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
