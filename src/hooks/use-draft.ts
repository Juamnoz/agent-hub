"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";

function getUserId(): string {
  // Read directly from persisted Zustand store in localStorage
  try {
    const raw = localStorage.getItem("lisa-auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      const user = parsed?.state?.user;
      if (user?.id) return user.id;
    }
  } catch { /* ignore */ }
  return "anon";
}

function loadDraft<T>(storageKey: string): { data: T; found: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return { data: JSON.parse(raw) as T, found: true };
  } catch { /* ignore */ }
  return null;
}

/**
 * Hook that persists form state in localStorage with debounce.
 * Key is scoped per logged-in user (userId) so drafts don't leak between accounts.
 * - On mount: loads saved draft or falls back to initialValue
 * - On change: auto-saves after 500ms of inactivity
 * - clearDraft(): removes the saved draft (call after successful submit)
 * - hasDraft: true if there was a saved draft when the component mounted
 */
export function useDraft<T>(key: string, initialValue: T) {
  const userId = useAuthStore((s) => s.user?.id) ?? getUserId();
  const storageKey = `lisa-draft-${userId}-${key}`;
  const loaded = useRef(loadDraft<T>(storageKey));

  const [hasDraft] = useState(() => loaded.current?.found ?? false);
  const [value, setValue] = useState<T>(() => loaded.current?.data ?? initialValue);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save with debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch { /* quota exceeded, ignore */ }
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, storageKey]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }, [storageKey]);

  return { value, setValue, hasDraft, clearDraft } as const;
}
