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

  // 🔥 ATTACH MESSAGE LISTENER BEFORE FB.login
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      console.log('📩 RAW EVENT:', event);

      // ✅ Allow BOTH origins (facebook.com and web.facebook.com)
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        console.log('❌ Wrong origin, ignoring:', event.origin);
        return;
      }

      let data;
      try {
        // ✅ Handle BOTH string and object data
        data = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : event.data;
      } catch (err) {
        console.log('❌ Not valid JSON, skipping');
        return;
      }

      console.log('✅ PARSED:', data);

      if (data?.type === 'WA_EMBEDDED_SIGNUP') {
        console.log('🔥 EMBED EVENT:', data.event);

        if (data.event === 'FINISH') {
          console.log('🚀 FINISH RECEIVED');

          // ✅ Extract from nested data.data object
          const wabaId = data?.data?.waba_id;
          const phoneNumberId = data?.data?.phone_number_id;
          const phoneNumber = data?.data?.phone_number;

          console.log('✅ Extracted values:');
          console.log('  wabaId:', wabaId);
          console.log('  phoneNumberId:', phoneNumberId);
          console.log('  phoneNumber:', phoneNumber);

          if (wabaId && phoneNumberId) {
            setSetupStep('connecting');
            console.log('🚀 Calling connect endpoint...');

            try {
              const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp/connect`;
              console.log('Backend URL:', backendUrl);

              const response = await axios.post(
                backendUrl,
                {
                  wabaId,
                  phoneNumberId,
                  phoneNumber
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );

              console.log('✅ Backend response:', response.data);

              if (response.data?.success) {
                console.log('🎉 CONNECTED! Phone registered and saved');
                setSetupStep('connected');
                setTimeout(() => {
                  onConnectionUpdate();
                }, 1500);
              } else {
                console.error('❌ Backend returned error:', response.data);
                setSetupStep('idle');
              }
            } catch (error: any) {
              console.error('❌ Connect call failed:', error.response?.data || error.message);
              setSetupStep('idle');
            }
          } else {
            console.error('❌ Missing required data:');
            console.error('  wabaId:', !!wabaId);
            console.error('  phoneNumberId:', !!phoneNumberId);
            setSetupStep('idle');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('✅ Message listener attached');

    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('✅ Message listener removed');
    };
  }, [token, onConnectionUpdate]);

  // ✅ Poll for status every 2 seconds when in polling state
  useEffect(() => {
    if (setupStep !== 'polling' || !token) return;

    const pollInterval = setInterval(async () => {
      setPollCount(prev => prev + 1);

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp/status`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log('Status poll:', response.data);

        // Check if webhook has arrived (status is now connected)
        if (response.data?.data?.status === 'connected' && response.data?.data?.phoneNumbers?.length > 0) {
          console.log('✅ Webhook received! Connection ready');
          setSetupStep('connected');
          clearInterval(pollInterval);
          
          // Refresh parent component
          setTimeout(() => {
            onConnectionUpdate();
          }, 1000);
        }
      } catch (error: any) {
        console.error('Poll failed:', error.response?.data || error.message);
      }
    }, 2000); // Poll every 2 seconds

    // Timeout after max polls
    const timeoutId = setTimeout(() => {
      if (pollCount >= MAX_POLLS) {
        console.warn('⚠️ Polling timeout - webhook did not arrive');
        clearInterval(pollInterval);
        setSetupStep('idle');
      }
    }, MAX_POLLS * 2000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [setupStep, token, pollCount, onConnectionUpdate]);

  // ✅ Start Embedded Signup
  const handleStartOAuth = () => {
    if (typeof window !== 'undefined' && (window as any).FB) {
      setSetupStep('connecting');
      console.log('🚀 Starting FB.login with Embedded Signup...');

      (window as any).FB.login(
        function (response: any) {
          console.log('✅ FB.login response:', response);

          if (response.authResponse) {
            console.log('✅ Auth success - waiting for FINISH event');
          } else {
            console.error('❌ FB.login failed:', response);
            setSetupStep('idle');
          }
        },
        {
          config_id: '1239299391737840',
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {}
          }
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
            {setupStep === 'connecting' ? 'Connecting WhatsApp...' : 'Waiting for webhook...'}
          </h3>
          <p className="text-slate-600 text-sm mt-2">
            {setupStep === 'connecting' 
              ? 'Complete onboarding on Meta'
              : `Waiting for Meta to confirm (${pollCount}/${MAX_POLLS})`}
          </p>
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
