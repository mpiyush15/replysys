'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'superadmin' | 'client';
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, isRole, hasPermission } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (requiredRole && !isRole(requiredRole)) {
    router.push('/unauthorized');
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    router.push('/unauthorized');
    return null;
  }

  return <>{children}</>;
}
