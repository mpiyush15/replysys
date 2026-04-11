'use client';

export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useCallback } from 'react';
import { MdSettings } from 'react-icons/md';
import { WhatsAppOAuthSetup } from '@/components/WhatsAppOAuthSetup';
import axios from 'axios';

export default function ActivitiesPage() {
  const user = useAuthStore((state) => state.user);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [wabaConnection, setWabaConnection] = useState<any>(null);

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const fetchWabaStatus = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWabaConnection(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch status:', error);
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined' && token) {
      fetchWabaStatus();
    }
  }, [token, fetchWabaStatus]);

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

        <WhatsAppOAuthSetup
          wabaConnection={wabaConnection}
          token={token}
          onConnectionUpdate={fetchWabaStatus}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
