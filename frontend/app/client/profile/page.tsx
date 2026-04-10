'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { WhatsAppSettingsModal } from '@/components/WhatsAppSettingsModal';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  return (
    <ProtectedRoute requiredRole="client">
      <DashboardLayout onSettingsClick={handleSettingsClick}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-6 lg:px-8"
        >
          <h1 className="text-4xl font-light text-slate-900 mb-2">
            My Profile
          </h1>
          <p className="text-olive-600 mb-8">
            Manage your account settings and preferences.
          </p>

          <div className="bg-white rounded-lg border border-olive-200 p-8 shadow-sm max-w-2xl">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <p className="text-slate-600">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <p className="text-slate-600">{user?.name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <p className="text-slate-600 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <WhatsAppSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          token={token}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
