// app/thank-you/page.tsx
'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function ThankYou() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-white"
    >
      {/* Animated Check Icon */}
      <div className="mb-6 relative">
        <CheckCircle className="w-20 h-20 text-green-500 animate-ping-slow" />
        <CheckCircle className="w-20 h-20 text-green-500 absolute top-0 left-0" />
      </div>

      <h1 className="text-4xl font-bold mb-4 text-purple-600">Thank You!</h1>
      <p className="text-lg max-w-md mb-6 text-gray-700">
        Your message has been received. We'll get back to you shortly.
      </p>
      <a
        href="/"
        className="text-purple-600 hover:underline text-lg font-medium"
      >
        Return to Home →
      </a>
    </motion.section>
  );
}
