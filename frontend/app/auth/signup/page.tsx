'use client';

import { motion } from 'framer-motion';
import { SignupForm } from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-mauve-50 to-mauve-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg border-2 border-mauve-300 shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-mauve-900 mb-2">
              Replysys
            </h1>
            <p className="text-mauve-600 font-light">
              Create your account & start messaging
            </p>
          </div>

          <SignupForm />

          <p className="text-center text-sm text-mauve-600 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-mauve-700 font-semibold hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
