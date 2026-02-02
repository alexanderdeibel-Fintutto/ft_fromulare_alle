import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Success Animation
 * Zeigt kurze Erfolgs- oder Fehlerfeedbacks an
 */

export default function SuccessAnimation({
  show,
  type = 'success', // 'success', 'error', 'warning'
  message,
  duration = 2000,
  onComplete
}) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  const colors = {
    success: { bg: 'bg-green-500', icon: CheckCircle2 },
    error: { bg: 'bg-red-500', icon: AlertCircle },
    warning: { bg: 'bg-yellow-500', icon: AlertCircle }
  };

  const { bg, icon: Icon } = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      className={`${bg} text-white rounded-lg p-3 flex items-center gap-2 shadow-lg`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}