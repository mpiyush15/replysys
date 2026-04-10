'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface WABAConnection {
  status: 'connected' | 'disconnected' | 'pending';
  wabaId?: string;
  phoneNumbers?: Array<{
    id: string;
    displayPhoneNumber: string;
    status: string;
  }>;
}

interface WhatsAppOAuthSetupProps {
  wabaConnection: WABAConnection | null;
  token: string | null;
  onConnectionUpdate: () => void;
}

export function WhatsAppOAuthSetup({
  wabaConnection,
  token,
  onConnectionUpdate,
}: WhatsAppOAuthSetupProps) {
  const [step, setStep] = useState<'select-waba' | 'sync-phones' | 'ready'>(
    wabaConnection?.status === 'connected' ? 'ready' : 'select-waba'
  );
  const [wabaList, setWabaList] = useState<any[]>([]);
  const [selectedWaba, setSelectedWaba] = useState<string>('');
  const [loadingWaba, setLoadingWaba] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [loadingPhones, setLoadingPhones] = useState(false);

  // Step 1: Start OAuth flow
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

  // Step 2: Fetch available WABAs
  const fetchWabas = async () => {
    if (!token) return;
    try {
      setLoadingWaba(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/oauth/wabas`,
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

  // Step 3: Sync phone numbers for selected WABA
  const syncPhoneNumbers = async () => {
    if (!token || !selectedWaba) return;
    try {
      setLoadingPhones(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/oauth/sync-phones`,
        { wabaId: selectedWaba },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPhoneNumbers(response.data.data || []);
      setStep('ready');
      onConnectionUpdate();
    } catch (error: any) {
      console.error('Failed to sync phones:', error.response?.data || error.message);
    } finally {
      setLoadingPhones(false);
    }
  };

  if (wabaConnection?.status === 'connected') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3">✅ WhatsApp Connected</h3>
          <div className="space-y-3 text-sm text-green-800">
            <div>
              <p className="font-medium">WABA ID:</p>
              <p className="text-green-700">{wabaConnection.wabaId}</p>
            </div>
            {wabaConnection.phoneNumbers && wabaConnection.phoneNumbers.length > 0 && (
              <div>
                <p className="font-medium mb-2">Connected Phone Numbers:</p>
                <ul className="space-y-2">
                  {wabaConnection.phoneNumbers.map((phone) => (
                    <li key={phone.id} className="flex items-center gap-2 text-green-700">
                      <span>📱</span>
                      <span>{phone.displayPhoneNumber}</span>
                      <span className="text-xs bg-green-200 px-2 py-1 rounded">
                        {phone.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStep('select-waba')}
          className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg hover:bg-slate-800 transition border-2 border-slate-900"
        >
          Reconfigure
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Step 1: OAuth */}
      <div className="border-l-4 border-slate-300 pl-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
            1
          </span>
          <h3 className="font-semibold text-slate-900">Connect WhatsApp Account</h3>
        </div>
        <p className="text-slate-600 text-sm mb-4">
          Click below to authorize Replysys to access your WhatsApp Business Account
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartOAuth}
          className="bg-green-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <span>🔗</span>
          Connect WhatsApp
        </motion.button>
      </div>

      {/* Step 2: Select WABA */}
      {step !== 'select-waba' && (
        <div className="border-l-4 border-slate-200 pl-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex-shrink-0 w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold">
              2
            </span>
            <h3 className="font-semibold text-slate-900">Select Business Account</h3>
          </div>
          <p className="text-slate-600 text-sm">
            Your WABA ID will be automatically selected
          </p>
        </div>
      )}

      {step === 'select-waba' && (
        <div className="border-l-4 border-slate-900 pl-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
              2
            </span>
            <h3 className="font-semibold text-slate-900">Select Business Account</h3>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Choose which WABA you want to connect
          </p>

          {!wabaList.length ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchWabas}
              disabled={loadingWaba}
              className="bg-slate-900 text-white font-medium py-2 px-6 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loadingWaba ? 'Loading WABAs...' : 'Fetch Available WABAs'}
            </motion.button>
          ) : (
            <div className="space-y-2">
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
                    className="w-4 h-4"
                  />
                  <span className="text-slate-900 font-medium">{waba.name || waba.id}</span>
                </label>
              ))}

              {selectedWaba && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={syncPhoneNumbers}
                  disabled={loadingPhones}
                  className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 mt-4"
                >
                  {loadingPhones ? 'Syncing phones...' : 'Continue to Phone Sync'}
                </motion.button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Sync Phones (Automatic) */}
      {step !== 'select-waba' && (
        <div className="border-l-4 border-slate-200 pl-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex-shrink-0 w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold">
              3
            </span>
            <h3 className="font-semibold text-slate-900">Sync Phone Numbers</h3>
          </div>
          <p className="text-slate-600 text-sm">
            Your phone numbers are being synced automatically
          </p>
        </div>
      )}

      {/* Status Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          <strong>💡 Tip:</strong> Once connected, you'll be able to send messages to all numbers
          registered in your WABA.
        </p>
      </div>
    </motion.div>
  );
}
