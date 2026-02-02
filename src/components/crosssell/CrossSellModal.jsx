import React from 'react';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CrossSellModal({ recommendation, onAccept, onDismiss, isVisible }) {
  if (!recommendation || !isVisible) return null;
  
  const { messaging, personalization } = recommendation;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onDismiss}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header mit Gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <button 
              onClick={onDismiss}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                {messaging?.icon || '✨'}
              </div>
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{messaging?.headline}</h2>
            
            {personalization?.user_name && (
              <p className="text-white/80 text-sm">
                Speziell für dich, {personalization.user_name}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 mb-6">{messaging?.body}</p>
            
            {/* Personalisierte Vorteile */}
            {(personalization?.savings_amount || personalization?.time_savings || personalization?.specific_benefit) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="font-medium text-green-800 mb-2">Dein Vorteil:</p>
                <ul className="space-y-1 text-sm text-green-700">
                  {personalization.savings_amount && (
                    <li>💰 Spare {personalization.savings_amount}</li>
                  )}
                  {personalization.time_savings && (
                    <li>⏱️ Spare {personalization.time_savings}</li>
                  )}
                  {personalization.specific_benefit && (
                    <li>✅ {personalization.specific_benefit}</li>
                  )}
                </ul>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-3">
              <button
                onClick={onAccept}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                {messaging?.cta_text || 'Jetzt upgraden'}
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={onDismiss}
                className="w-full px-6 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                {messaging?.dismiss_text || 'Vielleicht später'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}