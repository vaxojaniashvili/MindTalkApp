import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../api/client';
import { loginApi, registerApi, fetchMe } from '../api/endpoints';
import type { ApiUser } from '../types';

const TOKEN_KEY = 'mindtalk_token';

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await loginApi(email, password);
    const { user, token } = data;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (regData) => {
    const { data } = await registerApi(regData);
    const { user, token } = data;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        const { data } = await fetchMe();
        set({ user: data.data, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setAuthToken(null);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const { data } = await fetchMe();
      set({ user: data.data });
    } catch {}
  },
}));
