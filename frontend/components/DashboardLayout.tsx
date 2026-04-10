'use client';

import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
  onSettingsClick?: () => void;
}

export function DashboardLayout({ children, onSettingsClick }: DashboardLayoutProps) {
  const { initializeFromStorage, checkTokenExpiration, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Initialize auth from localStorage on mount
    initializeFromStorage();
  }, [initializeFromStorage]);

  // Check token expiration periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately
    const isValid = checkTokenExpiration();
    if (!isValid) {
      router.push('/login');
      return;
    }

    // Check every minute
    const interval = setInterval(() => {
      const isStillValid = checkTokenExpiration();
      if (!isStillValid) {
        router.push('/login');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTokenExpiration, router]);

  return (
    <div className="flex h-screen">
      <Sidebar onSettingsClick={onSettingsClick} />
      {/* Desktop: ml-64 for sidebar space, Mobile: no margin */}
      <div className="flex-1 lg:ml-64 w-full flex flex-col pt-14">
        <Topbar />
        <main className="flex-1 p-4 md:p-8 bg-olive-100 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
