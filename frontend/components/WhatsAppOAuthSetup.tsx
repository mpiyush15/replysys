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
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [oauthMessage, setOauthMessage] = useState('');

  // ✅ Initialize Facebook SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load FB SDK
      (window as any).fbAsyncInit = function() {
        (window as any).FB.init({
          appId: '2094709584392829',
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v25.0'
        });
      };

      // Load script if not already loaded
      if (!(window as any).FB) {
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }

      // ✅ Listen for postMessage from callback popup
      const handleMessage = async (event: MessageEvent) => {
        // Accept messages from callback page
        if (!event.origin.includes(window.location.hostname)) return;

        try {
          const data = event.data;
          
          if (data.type === 'WA_OAUTH_COMPLETE') {
            const { code, error, errorDescription } = data;

            if (error) {
              console.error('OAuth Error:', error, errorDescription);
              setOauthStatus('error');
              setOauthMessage(`Authorization failed: ${errorDescription || error}`);
              return;
            }

            if (code) {
              console.log('✅ Got OAuth code from callback:', code);
              setOauthStatus('loading');
              setOauthMessage('Exchanging code for token...');

              try {
                // Exchange code for token on our backend
                const response = await axios.post(
                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp`,
                  { code },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }
                );

                console.log('✅ OAuth successful:', response.data);
                setOauthStatus('success');
                setOauthMessage('✅ WhatsApp connected! Waiting for webhook...');

                // Refresh connection data
                setTimeout(() => {
                  onConnectionUpdate();
                }, 2000);
              } catch (error: any) {
                console.error('❌ Token exchange failed:', error);
                setOauthStatus('error');
                setOauthMessage(`Error: ${error.response?.data?.message || error.message}`);
              }
            }
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [token, onConnectionUpdate]);

  // Step 1: Start embedded signup flow
  const handleStartOAuth = () => {
    const appId = '2094709584392829';
    const configId = '930769915977028';
    
    if (typeof window !== 'undefined' && (window as any).FB) {
      setOauthStatus('loading');
      setOauthMessage('Opening WhatsApp onboarding...');

      // Use FB.XFBML.parse to load embedded signup in modal
      // This keeps user IN the app instead of redirecting
      const embeddedSignupUrl = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent('https://replysys.com/auth/whatsapp/callback')}&scope=whatsapp_business_management,whatsapp_business_messaging,business_management&response_type=code`;
      
      // Open in popup instead of full redirect
      const popup = window.open(
        embeddedSignupUrl,
        'Facebook Login',
        'width=500,height=600'
      );

      // Monitor popup for when it closes/completes
      if (popup) {
        const popupInterval = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(popupInterval);
              setOauthStatus('idle');
              setOauthMessage('');
              // Refresh status to check if OAuth completed
              setTimeout(() => {
                onConnectionUpdate();
              }, 1000);
            }
          } catch (e) {
            // Ignore cross-origin errors
          }
        }, 500);
      }
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
          disabled={oauthStatus === 'loading'}
          className="bg-green-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{oauthStatus === 'loading' ? '⏳' : '🔗'}</span>
          {oauthStatus === 'loading' ? 'Connecting...' : 'Connect WhatsApp'}
        </motion.button>

        {/* OAuth Status Messages */}
        {oauthStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm flex items-center gap-2"
          >
            <span>✅</span>
            <span>{oauthMessage}</span>
          </motion.div>
        )}

        {oauthStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm flex items-center gap-2"
          >
            <span>❌</span>
            <span>{oauthMessage}</span>
          </motion.div>
        )}

        {oauthStatus === 'loading' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-center gap-2"
          >
            <span>⏳</span>
            <span>{oauthMessage}</span>
          </motion.div>
        )}
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
          <strong>💡 Tip:</strong> Once connected, you&apos;ll be able to send messages to all numbers
          registered in your WABA.
        </p>
      </div>
    </motion.div>
  );
}
