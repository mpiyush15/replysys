'use client';

import { create } from 'zustand';
import { User, UserRole, UserRoleType } from '@/types/roles';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
  isRole: (role: UserRoleType) => boolean;
  initializeFromStorage: () => void;
  checkTokenExpiration: () => boolean;
  setTokenExpiration: (expiresAt: number) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: (user: User, token: string) => {
    set({ user, isAuthenticated: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      
      // Set token expiration to 7 days from now
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiresAt');
    }
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;

    const userRole = user.role;
    const permissions = require('@/types/roles').rolePermissions[userRole];

    return permissions[permission as keyof typeof permissions] || false;
  },

  isRole: (role: UserRoleType) => {
    const { user } = get();
    return user?.role === role;
  },

  checkTokenExpiration: () => {
    if (typeof window === 'undefined') return true;

    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
    if (!tokenExpiresAt) {
      return true; // No expiration set, assume not expired
    }

    const expiresAt = parseInt(tokenExpiresAt, 10);
    const now = Date.now();

    if (now > expiresAt) {
      // Token expired, logout
      get().logout();
      return false;
    }

    return true; // Token is still valid
  },

  setTokenExpiration: (expiresAt: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
    }
  },

  initializeFromStorage: () => {
    if (typeof window !== 'undefined') {
      // Just restore from storage - don't check expiration on init
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      
      if (storedUser && storedToken) {
        try {
          const user = JSON.parse(storedUser);
          set({ user, isAuthenticated: true });
          console.log('✅ Auth restored from localStorage');
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          localStorage.removeItem('tokenExpiresAt');
          set({ user: null, isAuthenticated: false });
        }
      }
    }
  },
}));
