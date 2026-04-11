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

      // ✅ Listen for postMessage from Embedded Signup
      const handleMessage = async (event: MessageEvent) => {
        console.log('📨 Message received from origin:', event.origin);
        console.log('Full event data:', JSON.stringify(event.data));
        
        // Accept messages from Facebook or same origin (for testing)
        const isValidOrigin = event.origin === 'https://www.facebook.com' || 
                              event.origin.includes('localhost') ||
                              event.origin.includes('replysys.com');
        
        if (!isValidOrigin) {
          console.log('❌ Wrong origin:', event.origin, '- ignoring');
          return;
        }

        try {
          const data = event.data;
          console.log('📦 Parsed message data:', data);
          console.log('📊 Message type:', data?.type);

          
          // Meta sends data directly (not nested)
          if (data?.type === 'WA_EMBEDDED_SIGNUP') {
            console.log('✅ WA_EMBEDDED_SIGNUP detected!');
            console.log('Full payload:', JSON.stringify(data, null, 2));
            
            const wabaId = data?.waba_id;
            const phoneNumberId = data?.phone_number_id;
            const phoneNumber = data?.phone_number;
            
            // 🔥 GET THE STORED CODE (THIS WAS MISSING!)
            const code = (window as any).whatsappAuthCode;

            console.log('✅ Extracted values:');
            console.log('  wabaId:', wabaId);
            console.log('  phoneNumberId:', phoneNumberId);
            console.log('  phoneNumber:', phoneNumber);
            console.log('  code:', code ? 'YES (stored from FB.login)' : 'NO - MISSING!');
            console.log('  token:', token ? 'YES' : 'NO');

            if (code && wabaId && phoneNumberId) {
              setSetupStep('connecting');
              console.log('✅ All data ready - calling backend!');

              try {
                console.log('🔄 Sending OAuth code to backend...');
                const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp`;
                console.log('Backend URL:', backendUrl);

                const response = await axios.post(
                  backendUrl,
                  { 
                    code,
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
                
                // Check if already connected (backend did full flow + register)
                if (response.data?.status === 'connected') {
                  console.log('🎉 ALREADY CONNECTED! Backend completed full flow');
                  setSetupStep('connected');
                  setTimeout(() => {
                    onConnectionUpdate();
                  }, 1000);
                } else {
                  // Otherwise poll for webhook
                  console.log('⏳ Starting polling for webhook...');
                  setSetupStep('polling');
                  setPollCount(0);
                }
              } catch (error: any) {
                console.error('❌ Backend call failed');
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
                console.error('Message:', error.message);
                setSetupStep('idle');
              }
            } else {
              console.error('❌ No code in data!');
            }
          } else {
            console.log('⚠️ Different message type (not WA_EMBEDDED_SIGNUP):', data.type);
          }
        } catch (err) {
          console.error('❌ Error parsing message:', err);
        }
      };

      window.addEventListener('message', handleMessage);
      console.log('✅ Message listener attached');
      return () => {
        window.removeEventListener('message', handleMessage);
        console.log('✅ Message listener removed');
      };
    }
  }, [token]);

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
        function(response: any) {
          console.log('✅ FB.login response:', response);
          console.log('   authResponse:', response?.authResponse);
          
          // 🔥 STORE THE CODE (THIS WAS MISSING!)
          if (response?.authResponse?.code) {
            const code = response.authResponse.code;
            console.log('💾 Storing auth code:', code.substring(0, 20) + '...');
            
            // Store globally so FINISH event can access it
            (window as any).whatsappAuthCode = code;
            console.log('✅ Code stored in window.whatsappAuthCode');
          }
        },
        { 
          config_id: '1239299391737840',
          response_type: 'code',
          override_default_response_type: true,
          extras: { version: 'v4' }
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
