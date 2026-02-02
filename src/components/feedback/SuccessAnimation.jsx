import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Success Animation
 * Celebratory feedback with optional confetti
 */

export default function SuccessAnimation({ 
  message = 'Erfolgreich!', 
  showConfetti = true,
  onComplete 
}) {
  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [showConfetti, onComplete]);

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 0.6, repeat: 2 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          <CheckCircle2 className="w-20 h-20 text-green-500" />
        </motion.div>
        <p className="text-xl font-semibold text-green-600">{message}</p>
      </motion.div>
    </motion.div>
  );
}