'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { MdAssessment } from 'react-icons/md';

export default function ReportsPage() {
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
              <MdAssessment className="text-4xl text-orange-600" />
              <h1 className="text-4xl font-light text-slate-900">Reports</h1>
            </div>
            <p className="text-olive-600 mb-8">
              View detailed reports and analytics
            </p>

            <div className="bg-white rounded-lg border border-olive-200 p-8 shadow-sm">
              <p className="text-center text-olive-600 py-12">
                Reports and analytics coming soon
              </p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}