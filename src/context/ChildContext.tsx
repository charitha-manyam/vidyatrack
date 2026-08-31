import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { getMyChildren } from "../api/parent.api";
import type { Child } from "../types/parent";

const LAST_CHILD_KEY = "vidyatrack.lastChild";

// Mirrors the web parent-portal's child context: URL :studentId +
// localStorage "lastChild". On mobile there is no URL, so the active child
// lives here and every child-scoped screen reads it from this context.
interface ChildContextValue {
  children: Child[];
  activeChild: Child | null;
  loading: boolean;
  error: string | null;
  setActiveChildId: (id: string) => void;
  reload: () => Promise<void>;
}

const ChildContext = createContext<ChildContextValue | null>(null);

export function ChildProvider({ children }: { children: React.ReactNode }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getMyChildren();
      setChildren(list);
      setActiveChildId((current) => {
        if (current && list.some((c) => c.id === current)) return current;
        return list[0]?.id ?? null;
      });
    } catch (err) {
      setError(getErrMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(LAST_CHILD_KEY);
        if (saved) setActiveChildId(saved);
      } catch {
        // best-effort only
      }
      await reload();
    })();
  }, [reload]);

  const selectChild = useCallback((id: string) => {
    setActiveChildId(id);
    SecureStore.setItemAsync(LAST_CHILD_KEY, id).catch(() => {});
  }, []);

  const activeChild = children.find((c) => c.id === activeChildId) ?? null;

  return (
    <ChildContext.Provider
      value={{ children, activeChild, loading, error, setActiveChildId: selectChild, reload }}
    >
      {children}
    </ChildContext.Provider>
  );
}

function getErrMessage(err: unknown) {
  return String((err as Error)?.message ?? err);
}

export function useActiveChild() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error("useActiveChild must be used inside ChildProvider");
  return ctx;
}
