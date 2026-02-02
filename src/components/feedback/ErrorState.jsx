import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Error State
 * Display errors with retry option
 */

export default function ErrorState({ 
  title = 'Fehler',
  message = 'Etwas ist schief gelaufen',
  error,
  onRetry,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        </motion.div>

        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">{title}</h3>
          <p className="text-sm text-red-700 mb-3">{message}</p>
          
          {error && (
            <p className="text-xs text-red-600 bg-white/50 p-2 rounded mb-3 font-mono">
              {error}
            </p>
          )}

          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Erneut versuchen
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}