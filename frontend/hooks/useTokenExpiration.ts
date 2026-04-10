import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export function useTokenExpiration() {
  const { isAuthenticated, logout, checkTokenExpiration } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check token expiration immediately on mount
    const isValid = checkTokenExpiration();
    if (!isValid) {
      router.push('/login');
      return;
    }

    // Set up interval to check token expiration every minute
    const interval = setInterval(() => {
      const isStillValid = checkTokenExpiration();
      if (!isStillValid) {
        router.push('/login');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTokenExpiration, logout, router]);
}
