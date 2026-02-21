import { create } from 'zustand';
import { User } from '../core/models';
import { authApi } from '../core/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (userId: string) => Promise<boolean>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  initAuth: () => {
    const user = authApi.getCurrentUser();
    set({ user, isAuthenticated: !!user });
  },

  login: async (email: string, password: string) => {
    const user = await authApi.login(email, password);
    if (user) {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  switchRole: async (userId: string) => {
    const user = await authApi.switchRole(userId);
    if (user) {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  }
}));