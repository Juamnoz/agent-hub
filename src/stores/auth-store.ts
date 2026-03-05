"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, setToken, clearToken, type AuthUser } from "@/lib/api";

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,

      isAuthenticated: () => !!get().token && !!get().user,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await authApi.login(email, password);
          setToken(res.token);
          set({ user: res.user, token: res.token, refreshToken: res.refreshToken, loading: false });
        } catch (err: any) {
          set({ error: err.message ?? "Error al iniciar sesión", loading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await authApi.register({ name, email, password });
          setToken(res.token);
          set({ user: res.user, token: res.token, refreshToken: res.refreshToken, loading: false });
        } catch (err: any) {
          set({ error: err.message ?? "Error al crear cuenta", loading: false });
          throw err;
        }
      },

      logout: () => {
        clearToken();
        set({ user: null, token: null, refreshToken: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "lisa-auth",
      partialState: (state: AuthStore) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    } as any,
  )
);
