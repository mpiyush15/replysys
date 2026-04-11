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
  const [setupStep, setSetupStep] = useState<'idle' | 'connecting' | 'polling' | 'connected'>('idle');
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 30; // Poll for up to 60 seconds (30 * 2 seconds)

  // ✅ Initialize Facebook SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fbAsyncInit = function() {
        (window as any).FB.init({
          appId: '2094709584392829',
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v25.0'
        });
      };

      if (!(window as any).FB) {
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // 🔥 ATTACH MESSAGE LISTENER ONCE (STAYS ALIVE ALWAYS)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      let data;
      try {
        data = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : event.data;
      } catch (err) {
        return;
      }

      // ✅ FINISH event
      if (data?.type === 'WA_EMBEDDED_SIGNUP' && data?.event === 'FINISH') {
        console.log('✅ FINISH EVENT DETECTED');
        console.log('DATA:', JSON.stringify(data, null, 2));

        const wabaId = data?.data?.waba_id;
        const phoneNumberId = data?.data?.phone_number_id;
        
        // ✅ Handle both naming conventions
        const phoneNumber = 
          data?.data?.display_phone_number || 
          data?.data?.phone_number || 
          'unknown';

        console.log('Extracted:', { wabaId, phoneNumberId, phoneNumber });

        if (wabaId && phoneNumberId && token) {
          setSetupStep('connecting');
          console.log('🔄 Calling backend to register phone...');

          try {
            const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp/connect`;
            
            console.log('📤 POST', backendUrl);
            console.log('Body:', { wabaId, phoneNumberId, phoneNumber });

            const response = await axios.post(
              backendUrl,
              { wabaId, phoneNumberId, phoneNumber },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✅ BACKEND RESPONSE:', response.data);

            if (response.data?.success) {
              console.log('🎉 REGISTERED - starting polling to confirm');
              setSetupStep('polling');
              setPollCount(0);
            } else {
              console.error('❌ Backend returned error:', response.data);
              setSetupStep('idle');
            }
          } catch (error: any) {
            console.error('❌ BACKEND ERROR:', error.response?.data || error.message);
            console.error('Status:', error.response?.status);
            setSetupStep('idle');
          }
        } else {
          console.error('❌ Missing data:', { wabaId, phoneNumberId, token: !!token });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [token, onConnectionUpdate]);

  // ✅ Poll for status every 2 seconds when in polling state
  useEffect(() => {
    if (setupStep !== 'polling' || !token) return;

    let currentPollCount = 0;
    const MAX_POLL_TIME = 30000; // 30 seconds max

    const pollInterval = setInterval(async () => {
      currentPollCount++;

      if (currentPollCount > MAX_POLLS) {
        console.warn(`⚠️ Polling timeout after ${MAX_POLLS} attempts`);
        clearInterval(pollInterval);
        setSetupStep('idle');
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp/status`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Check if phone is now connected
        if (response.data?.data?.status === 'connected' && response.data?.data?.phoneNumbers?.length > 0) {
          console.log('✅ Phone connected! Stopping poll');
          setSetupStep('connected');
          clearInterval(pollInterval);
          
          setTimeout(() => {
            onConnectionUpdate();
          }, 1000);
        }
      } catch (error: any) {
        console.error('Poll failed:', error.message);
      }
    }, 2000);

    // Hard stop after 30 seconds
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Polling stopped - timeout reached');
      clearInterval(pollInterval);
      setSetupStep('idle');
    }, MAX_POLL_TIME);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [setupStep, token, onConnectionUpdate]);

  // ✅ Start Embedded Signup
  const handleStartOAuth = () => {
    if (typeof window !== 'undefined' && (window as any).FB) {
      setSetupStep('connecting');
      console.log('🚀 Starting FB.login...');

      (window as any).FB.login(
        function (response: any) {
          console.log('✅ FB.login response:', response?.authResponse?.status);
          
          // Start polling for phone registration
          if (response?.authResponse) {
            console.log('🔄 Starting auto-poll for phone...');
            setSetupStep('polling');
            setPollCount(0);
          }
        },
        {
          config_id: '1239299391737840',
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {} }
        }
      );
    } else {
      console.error('Facebook SDK not ready');
    }
  };

  // ✅ Show connected state if already connected
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
            {wabaConnection.phoneNumbers && wabaConnection.phoneNumbers.length > 0 && (
              <div>
                <p className="font-medium mb-2">Phone Numbers:</p>
                <ul className="space-y-2">
                  {wabaConnection.phoneNumbers.map((phone) => (
                    <li key={phone.id} className="flex items-center gap-2">
                      <span>📱 {phone.displayPhoneNumber}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ✅ Show connecting/polling state
  if (setupStep === 'connecting' || setupStep === 'polling') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-6 bg-white rounded-lg border border-slate-200"
      >
        <div className="text-center">
          <div className="inline-block">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full"
            />
          </div>
          <h3 className="font-semibold text-slate-900 mt-4">
            {setupStep === 'connecting' ? 'Connecting WhatsApp...' : 'Waiting for confirmation...'}
          </h3>
          <p className="text-slate-600 text-sm mt-2">
            {setupStep === 'connecting' 
              ? 'Complete onboarding on Meta'
              : `Checking status... (${pollCount}/${MAX_POLLS})`}
          </p>

          {setupStep === 'polling' && (
            <button
              onClick={() => {
                setSetupStep('idle');
                setPollCount(0);
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // ✅ Show connected after polling completes
  if (setupStep === 'connected') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4 p-6 bg-green-50 rounded-lg border border-green-200"
      >
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-semibold text-green-900">WhatsApp Connected!</h3>
          <p className="text-green-700 text-sm mt-2">Your phone number is ready to use</p>
        </div>
      </motion.div>
    );
  }

  // ✅ Show initial state
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6 bg-white rounded-lg border border-slate-200"
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Connect WhatsApp Account</h2>
        <p className="text-slate-600 text-sm">
          Click below to authorize Replysys to access your WhatsApp Business Account
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleStartOAuth}
        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
      >
        Connect WhatsApp
      </motion.button>
    </motion.div>
  );
}
