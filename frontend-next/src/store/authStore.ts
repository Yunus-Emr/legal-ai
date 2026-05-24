/**
 * Zustand Auth Store — global authentication state
 *
 * Auth stratejisi:
 * - Token: httpOnly cookie'de saklanır (backend tarafından set edilir)
 * - User: Zustand + localStorage persist (non-sensitive data)
 * - isAuthenticated: user null olmadığında true
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setToken, removeToken } from "@/lib/auth";
import { authApi } from "@/lib/api";
import type { UserOut } from "@/lib/api";

interface AuthState {
  user: UserOut | null;
  isAuthenticated: boolean;
  isLoadingUser: boolean;

  setAuth: (token: string | undefined, user: UserOut) => void;
  setUser: (user: UserOut) => void;
  setLoadingUser: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoadingUser: false,

      setAuth: (token, user) => {
        if (token) setToken(token);
        set({ user, isAuthenticated: true });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setLoadingUser: (loading) => {
        set({ isLoadingUser: loading });
      },

      logout: async () => {
        try {
          await authApi.logout(); // Backend cookie'leri temizler
        } catch {
          // Sessizce geç
        }
        removeToken(); // localStorage fallback temizleme
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "lexai-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Token artık persist edilmiyor — cookie yeterli
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
