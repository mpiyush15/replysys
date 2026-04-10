'use client';

import { motion } from 'framer-motion';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-mauve-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg border-2 border-mauve-300 shadow-lg p-8">
          <h1 className="text-4xl font-light text-mauve-900 mb-2 text-center">
            Replysys
          </h1>
          <p className="text-center text-mauve-600 mb-8 font-light">
            Sign in to your account
          </p>

          <LoginForm />
        </div>
      </motion.div>
    </main>
  );
}
