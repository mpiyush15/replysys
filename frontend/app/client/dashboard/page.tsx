'use client';

export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WhatsAppSettingsModal } from '@/components/WhatsAppSettingsModal';
import { LiveChat } from '@/components/LiveChat/LiveChat';

function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const searchParams = useSearchParams();
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  return (
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
  );
}

export default function ClientDashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <ProtectedRoute requiredRole="client">
      <DashboardLayout onSettingsClick={() => setIsSettingsOpen(true)}>
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600">Loading...</p>
            </div>
          </div>
        }>
          <DashboardContent />
        </Suspense>
        
        {/* Settings Modal - Outside Suspense */}
        <WhatsAppSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          token={typeof window !== 'undefined' ? localStorage.getItem('authToken') : null}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}


