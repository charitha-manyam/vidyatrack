import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuthToken } from "../lib/apiClient";
import { clearSession, loadSession, saveSession } from "../lib/storage";
import type { Session } from "../types/auth";

interface AuthContextValue {
  session: Session | null;
  isRestoring: boolean;
  setSession: (session: Session) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore whatever session was last persisted (if any) so a returning user
  // isn't dropped back to the role picker every time they open the app.
  useEffect(() => {
    (async () => {
      try {
        const raw = await loadSession();
        if (raw) {
          const parsed = JSON.parse(raw) as Session;
          setAuthToken(parsed.token);
          setSessionState(parsed);
        }
      } catch {
        // Corrupt/unreadable session — treat as logged out rather than crash.
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  function setSession(next: Session) {
    setAuthToken(next.token);
    setSessionState(next);
    saveSession(JSON.stringify(next)).catch(() => {});
  }

  function logout() {
    setAuthToken(null);
    setSessionState(null);
    clearSession().catch(() => {});
  }

  const value = useMemo(() => ({ session, isRestoring, setSession, logout }), [session, isRestoring]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
