'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeFromStorage } = useAuthStore();

  useEffect(() => {
    // Restore auth from localStorage on app load
    initializeFromStorage();
  }, [initializeFromStorage]);

  return <>{children}</>;
}
