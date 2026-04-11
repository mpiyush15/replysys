'use client';

export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MdCheckCircle, MdError, MdRefresh, MdLink } from 'react-icons/md';
import { WhatsAppOAuthSetup } from '@/components/WhatsAppOAuthSetup';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [wabaConnection, setWabaConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchWabaStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWabaConnection(response.data.data);
    } catch (error) {
      console.error('Failed to fetch WABA status:', error);
      setWabaConnection(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isClient && token) {
      // Fetch initial status only once
      fetchWabaStatus();
    }
  }, [isClient, token]);

  const handleConnectWhatsApp = () => {
    setShowWhatsAppSetup(true);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp? This cannot be undone.')) {
      return;
    }

    try {
      setSyncing(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/disconnect`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWabaConnection(null);
      alert('WhatsApp disconnected successfully');
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect WhatsApp');
    } finally {
      setSyncing(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole="client">
      <DashboardLayout onSettingsClick={() => {}}>
        <div className="w-full h-full p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-3 gap-6 h-full"
          >
            {/* Column 1: Account Information */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-y-auto">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 sticky top-0 bg-white pb-2">Account</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <p className="text-slate-900 text-sm bg-slate-50 p-2 rounded border border-slate-200">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                  <p className="text-slate-900 text-sm bg-slate-50 p-2 rounded border border-slate-200">{user?.name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                  <p className="text-slate-900 text-sm bg-slate-50 p-2 rounded border border-slate-200 capitalize">{user?.role}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <p className="text-slate-900 text-sm bg-green-50 p-2 rounded border border-green-200 font-medium">Active</p>
                </div>
              </div>
            </div>

            {/* Column 2: WhatsApp Status */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-y-auto">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 sticky top-0 bg-white pb-2">WhatsApp</h2>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="inline-block w-6 h-6 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-2"></div>
                  <p className="text-slate-600 text-xs">Loading...</p>
                </div>
              ) : wabaConnection?.status === 'connected' ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MdCheckCircle className="text-green-600 text-base" />
                      <h3 className="font-semibold text-green-900 text-sm">Connected</h3>
                    </div>
                    <p className="text-green-700 text-xs">Account active</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-1">WABA ID</p>
                    <p className="text-slate-900 font-mono text-xs break-all">{wabaConnection.wabaId}</p>
                  </div>

                  {wabaConnection.phoneNumbers && wabaConnection.phoneNumbers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-900 mb-2">Phones</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {wabaConnection.phoneNumbers.map((phone: any) => (
                          <div key={phone.id} className="bg-slate-50 p-2 rounded border border-slate-200">
                            <p className="font-medium text-slate-900 text-xs">{phone.displayPhoneNumber}</p>
                            <p className="text-xs text-green-600 capitalize">{phone.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={fetchWabaStatus}
                      disabled={syncing}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 text-white rounded text-xs hover:bg-slate-800 disabled:opacity-50 font-medium transition"
                    >
                      <MdRefresh className={syncing ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={syncing}
                      className="flex-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 font-medium transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MdError className="text-blue-600 text-base" />
                      <h3 className="font-semibold text-blue-900 text-sm">Not Connected</h3>
                    </div>
                    <p className="text-blue-700 text-xs">Connect to get started</p>
                  </div>

                  <button
                    onClick={handleConnectWhatsApp}
                    disabled={loading}
                    className="w-full bg-green-600 text-white font-semibold py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  >
                    <MdLink className="text-base" />
                    Connect
                  </button>

                  <button
                    onClick={fetchWabaStatus}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-slate-200 text-slate-900 rounded text-xs hover:bg-slate-300 disabled:opacity-50 font-medium transition"
                  >
                    <MdRefresh className={loading ? 'animate-spin' : ''} />
                    Refresh Saved Connections
                  </button>
                </motion.div>
              )}
            </div>

            {/* Column 3: Setup Guide */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-y-auto">
              {wabaConnection?.status === 'connected' ? (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 sticky top-0 bg-white pb-2">Benefits</h2>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <MdCheckCircle className="text-green-600 text-base flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm">Send & receive messages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MdCheckCircle className="text-green-600 text-base flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm">Multiple phone numbers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MdCheckCircle className="text-green-600 text-base flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm">Track delivery status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MdCheckCircle className="text-green-600 text-base flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm">Real-time notifications</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 sticky top-0 bg-white pb-2">Setup Steps</h2>
                  <ol className="space-y-2">
                    {[
                      { num: '1', title: 'Click Connect', desc: 'Redirect to Facebook' },
                      { num: '2', title: 'Login', desc: 'Use your account' },
                      { num: '3', title: 'Authorize', desc: 'Grant permissions' },
                      { num: '4', title: 'Select WABA', desc: 'Business account' },
                      { num: '5', title: 'Sync Phones', desc: 'Auto-sync numbers' },
                    ].map((step) => (
                      <div key={step.num} className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {step.num}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{step.title}</p>
                          <p className="text-slate-600 text-xs">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* WhatsApp Setup Modal */}
        {showWhatsAppSetup && (
          <WhatsAppOAuthSetup
            wabaConnection={wabaConnection}
            token={token}
            onConnectionUpdate={() => {
              fetchWabaStatus();
              setShowWhatsAppSetup(false);
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
