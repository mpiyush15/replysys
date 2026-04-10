'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MdClose } from 'react-icons/md';

interface WhatsAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

export function WhatsAppSettingsModal({
  isOpen,
  onClose,
  token,
}: WhatsAppSettingsModalProps) {
  const [wabaConnection, setWabaConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'status' | 'connect' | 'select-waba'>('status');
  const [wabaList, setWabaList] = useState<any[]>([]);
  const [selectedWaba, setSelectedWaba] = useState<string>('');
  const [loadingWaba, setLoadingWaba] = useState(false);
  const [loadingPhones, setLoadingPhones] = useState(false);

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
      setStep('status');
    } catch (error) {
      console.error('Failed to fetch WABA status:', error);
      setStep('connect');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && token) {
      // Fetch status only when modal opens or token changes
      // Don't include fetchWabaStatus in deps to avoid infinite loops
      const performFetch = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp/status`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setWabaConnection(response.data.data);
          setStep('status');
        } catch (error) {
          console.error('Failed to fetch WABA status:', error);
          setStep('connect');
        } finally {
          setLoading(false);
        }
      };
      
      performFetch();
    }
  }, [isOpen, token]);

  const handleStartOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_WHATSAPP_CLIENT_ID || '';
    
    if (!clientId) {
      alert('WhatsApp Client ID not configured. Please check environment variables.');
      console.error('NEXT_PUBLIC_WHATSAPP_CLIENT_ID is not set');
      return;
    }

    const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/whatsapp/callback`;
    const state = Buffer.from(JSON.stringify({ accountId: 'current' })).toString('base64');

    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=whatsapp_business_messaging,whatsapp_business_management&state=${state}`;

    if (typeof window !== 'undefined') {
      window.location.href = oauthUrl;
    }
  };

  const fetchWabas = async () => {
    if (!token) return;
    try {
      setLoadingWaba(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/wabas`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWabaList(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch WABAs:', error.response?.data || error.message);
    } finally {
      setLoadingWaba(false);
    }
  };

  const syncPhoneNumbers = async () => {
    if (!token || !selectedWaba) return;
    try {
      setLoadingPhones(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/sync-phones`,
        { wabaId: selectedWaba },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchWabaStatus();
    } catch (error: any) {
      console.error('Failed to sync phones:', error.response?.data || error.message);
    } finally {
      setLoadingPhones(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  WhatsApp Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <MdClose className="text-2xl text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                    <p className="text-slate-600 mt-4">Loading WhatsApp settings...</p>
                  </div>
                ) : wabaConnection?.status === 'connected' ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                      <h3 className="font-bold text-green-900 mb-4 text-lg">
                        ✅ WhatsApp Connected
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-green-700">WABA ID</p>
                          <p className="text-green-900 font-mono text-sm mt-1">
                            {wabaConnection.wabaId}
                          </p>
                        </div>
                        {wabaConnection.phoneNumbers && (
                          <div>
                            <p className="text-sm font-medium text-green-700 mb-2">
                              Connected Phone Numbers
                            </p>
                            <div className="space-y-2">
                              {wabaConnection.phoneNumbers.map((phone: any) => (
                                <div
                                  key={phone.id}
                                  className="flex items-center justify-between bg-white p-3 rounded border border-green-200"
                                >
                                  <span className="text-green-900 font-medium">
                                    {phone.displayPhoneNumber}
                                  </span>
                                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                    {phone.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setStep('select-waba');
                        fetchWabas();
                      }}
                      className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg hover:bg-slate-800 transition"
                    >
                      Change WABA
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {step === 'connect' && (
                      <div className="text-center space-y-4">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                          <p className="text-blue-900 mb-4">
                            No WhatsApp Business Account connected yet.
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStartOAuth}
                            className="bg-green-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 mx-auto"
                          >
                            <span>🔗</span>
                            Connect WhatsApp Business Account
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {step === 'select-waba' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900">Select Business Account</h3>
                        {!wabaList.length ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={fetchWabas}
                            disabled={loadingWaba}
                            className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg disabled:opacity-50"
                          >
                            {loadingWaba ? 'Loading...' : 'Fetch WABAs'}
                          </motion.button>
                        ) : (
                          <>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {wabaList.map((waba) => (
                                <label
                                  key={waba.id}
                                  className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-slate-900 transition"
                                >
                                  <input
                                    type="radio"
                                    name="waba"
                                    value={waba.id}
                                    checked={selectedWaba === waba.id}
                                    onChange={(e) => setSelectedWaba(e.target.value)}
                                  />
                                  <span className="text-slate-900 font-medium">
                                    {waba.name || waba.id}
                                  </span>
                                </label>
                              ))}
                            </div>
                            {selectedWaba && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={syncPhoneNumbers}
                                disabled={loadingPhones}
                                className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg disabled:opacity-50"
                              >
                                {loadingPhones ? 'Syncing...' : 'Continue'}
                              </motion.button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
