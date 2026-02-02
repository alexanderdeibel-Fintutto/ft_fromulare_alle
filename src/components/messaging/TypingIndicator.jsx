import React from 'react';
import { motion } from 'framer-motion';

/**
 * Typing Indicator - zeigt an wenn jemand tippt
 */
export default function TypingIndicator({ userName = 'Jemand' }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <span>{userName} schreibt</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}