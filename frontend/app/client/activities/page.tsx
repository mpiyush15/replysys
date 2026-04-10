'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { MdSettings } from 'react-icons/md';
import { WhatsAppSettingsModal } from '@/components/WhatsAppSettingsModal';

export default function ActivitiesPage() {
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
            My Activities
          </h1>
          <p className="text-olive-600 mb-8">
            Track your campaign activities, interactions, and engagement metrics.
          </p>

          <div className="bg-white rounded-lg border border-olive-200 p-8 shadow-sm">
            <p className="text-center text-olive-600">
              Activities feature coming soon
            </p>
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
