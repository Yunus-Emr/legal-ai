/**
 * Zustand Auth Store — global authentication state
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setToken, removeToken } from "@/lib/auth";
import type { UserOut } from "@/lib/api";

interface AuthState {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoadingUser: boolean;

  setAuth: (token: string, user: UserOut) => void;
  setUser: (user: UserOut) => void;
  setLoadingUser: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoadingUser: false,

      setAuth: (token, user) => {
        setToken(token);
        set({ token, user, isAuthenticated: true });
      },

      setUser: (user) => {
        set({ user });
      },

      setLoadingUser: (loading) => {
        set({ isLoadingUser: loading });
      },

      logout: () => {
        removeToken();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "lexai-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
