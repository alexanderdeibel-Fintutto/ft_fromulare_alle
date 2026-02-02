import React, { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CrossSellToast({ recommendation, onAccept, onDismiss, isVisible }) {
  if (!recommendation || !isVisible) return null;
  
  const { messaging } = recommendation;

  // Auto-dismiss nach 10 Sekunden
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onDismiss, 10000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Gradient Bar */}
        <div className="h-1 bg-gradient-to-r from-purple-600 to-blue-600" />
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{messaging?.icon || '✨'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{messaging?.headline}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{messaging?.body}</p>
            </div>
            <button 
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={onAccept}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            {messaging?.cta_text || 'Mehr erfahren'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}