'use client';

export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { MdSettings } from 'react-icons/md';

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="superadmin">
      <DashboardLayout>
        <div className="w-full px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <MdSettings className="text-4xl text-red-600" />
              <h1 className="text-4xl font-light text-slate-900">Settings</h1>
            </div>
            <p className="text-olive-600 mb-8">
              Configure system settings and preferences
            </p>

            <div className="bg-white rounded-lg border border-olive-200 p-8 shadow-sm">
              <p className="text-center text-olive-600 py-12">
                Settings coming soon
              </p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}