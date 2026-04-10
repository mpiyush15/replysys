'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

function WhatsAppCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { initializeFromStorage } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting WhatsApp...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract code and state from URL params
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth error
        if (error) {
          console.error('OAuth Error:', error, errorDescription);
          setStatus('error');
          setMessage(`Authorization failed: ${errorDescription || error}`);
          
          // Restore session and redirect back to dashboard after 3 seconds
          setTimeout(() => {
            initializeFromStorage();
            router.push('/client/dashboard');
          }, 3000);
          return;
        }

        // Check if code is present
        if (!code) {
          console.error('No authorization code received');
          setStatus('error');
          setMessage('No authorization code received. Please try again.');
          
          setTimeout(() => {
            initializeFromStorage();
            router.push('/client/dashboard');
          }, 3000);
          return;
        }

        console.log('📱 OAuth Callback received:', { code: code.substring(0, 20) + '...', state });
        setMessage('Exchanging code for access token...');

        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          setStatus('error');
          setMessage('Session expired. Please login again.');
          
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        // Send code to backend to exchange for tokens
        console.log('🔄 Sending code to backend for token exchange...');
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp`,
          { code, state },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log('✅ OAuth successful:', response.data);

        // Check if successful
        if (response.data.success) {
          setStatus('success');
          setMessage('✅ WhatsApp connected successfully!\n\nSyncing your business account details...');
          
          // Restore session from localStorage to maintain auth state
          initializeFromStorage();
          
          // Wait for webhook to process (usually instant but can take up to 30 seconds)
          // Then redirect to settings to show the stored WABA ID and phone numbers
          setTimeout(() => {
            router.push('/client/dashboard?tab=settings');
          }, 3000);
        } else {
          throw new Error(response.data.message || 'OAuth exchange failed');
        }
      } catch (error: any) {
        console.error('❌ OAuth Callback Error:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
          error.message ||
          'Failed to connect WhatsApp. Please try again.'
        );

        // Restore session and redirect back after 3 seconds
        setTimeout(() => {
          initializeFromStorage();
          router.push('/client/dashboard');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, initializeFromStorage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center"
      >
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Connecting WhatsApp
            </h2>
            <p className="text-slate-600 text-sm">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Success!
            </h2>
            <p className="text-green-700 mb-6">{message}</p>
            <p className="text-sm text-slate-600">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-red-700 mb-6">{message}</p>
            <p className="text-sm text-slate-600">
              Redirecting back to dashboard...
            </p>
          </>
        )}

        {/* Status Indicator */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-xs text-slate-500 space-y-1">
            <p>Status: <span className="font-mono">{status.toUpperCase()}</span></p>
            <p>Timestamp: <span className="font-mono">{new Date().toLocaleTimeString()}</span></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
export default function WhatsAppCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <WhatsAppCallbackContent />
    </Suspense>
  );
}