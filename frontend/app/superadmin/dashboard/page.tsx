'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

export default function SuperadminDashboard() {
  const { user } = useAuthStore();

  return (
    <ProtectedRoute requiredRole="superadmin">
      <DashboardLayout>
        <div className="w-full px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-light text-slate-900 mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'Admin'}!
            </h1>
            <p className="text-olive-600 mb-8">
              Select an option to get started
            </p>

            <div className="bg-white rounded-lg border border-olive-200 p-8 shadow-sm">
              <p className="text-center text-olive-600">
                Dashboard content coming soon
              </p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
