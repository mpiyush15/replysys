'use client';

import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen bg-mauve-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-6xl font-light text-mauve-900 mb-4" style={{ fontFamily: 'Montserrat' }}>
          Welcome to Replysys
        </h1>
        <p className="text-xl text-mauve-700 font-light">
          AI-powered smart replies
        </p>
      </motion.div>
    </main>
  );
}
