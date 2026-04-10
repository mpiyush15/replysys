'use client';

import { useAuthStore } from '@/store/authStore';

export function Topbar() {
  const { user } = useAuthStore();

  return (
    <div className="fixed top-0 left-64 right-0 bg-white border-b border-mauve-200 shadow-sm h-14 flex items-center justify-between px-6 z-40">
      <div>
        <h1 className="text-lg font-light text-mauve-900">Replysys</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-medium text-mauve-900">{user?.name}</p>
          <p className="text-xs text-mauve-600 capitalize">{user?.role}</p>
        </div>

        <div className="w-8 h-8 rounded-full bg-mauve-300 flex items-center justify-center text-mauve-900 font-bold text-sm">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
