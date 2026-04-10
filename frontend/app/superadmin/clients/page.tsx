'use client';

export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { MdBusiness } from 'react-icons/md';

export default function ClientsPage() {
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
              <MdBusiness className="text-4xl text-purple-600" />
              <h1 className="text-4xl font-light text-slate-900">Clients</h1>
            </div>
            <p className="text-olive-600 mb-8">
              Manage all your clients and their information
            </p>

            <div className="bg-white rounded-lg border border-olive-200 p-8 shadow-sm">
              <p className="text-center text-olive-600 py-12">
                Client management features coming soon
              </p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}