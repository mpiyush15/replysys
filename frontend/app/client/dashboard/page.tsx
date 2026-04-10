'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WhatsAppSettingsModal } from '@/components/WhatsAppSettingsModal';
import { LiveChat } from '@/components/LiveChat/LiveChat';

export default function ClientDashboard() {
  const user = useAuthStore((state) => state.user);
  const searchParams = useSearchParams();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'messages'>('dashboard');

  // Set active tab from query params
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'messages') {
      setActiveTab('messages');
    } else {
      setActiveTab('dashboard');
    }
  }, [searchParams]);

  // Get token from localStorage
  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  return (
    <ProtectedRoute requiredRole="client">
      <DashboardLayout onSettingsClick={handleSettingsClick}>
        <div className={`w-full ${activeTab === 'messages' ? 'p-0' : ''}`}>
          {activeTab === 'messages' ? (
            <div className="h-[calc(100vh-80px)] -m-4 md:-m-8">
              <LiveChat token={token} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="px-6 lg:px-8"
            >
              <h1 className="text-4xl font-light text-slate-900 mb-2">
                Welcome, {user?.email?.split('@')[0] || 'Client'}!
              </h1>
              <p className="text-olive-600 mb-8">
                You&apos;re logged in as a client. Select an option to get started.
              </p>

              <div className="bg-white rounded-lg border border-olive-200 p-8 shadow-sm">
                <p className="text-center text-olive-600">
                  Client dashboard features coming soon
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <WhatsAppSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          token={token}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
