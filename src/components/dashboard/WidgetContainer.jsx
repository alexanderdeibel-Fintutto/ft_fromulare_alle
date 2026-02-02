import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2 } from 'lucide-react';

/**
 * Widget Container
 * Container with collapse/expand/close functionality
 */

export default function WidgetContainer({
  title,
  children,
  collapsible = true,
  closable = true,
  onClose,
  defaultExpanded = true,
  fullWidth = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isClosed, setIsClosed] = useState(false);

  const handleClose = () => {
    setIsClosed(true);
    onClose?.();
  };

  if (isClosed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>

          <div className="flex items-center gap-2">
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4 text-gray-600" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}

            {closable && (
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4"
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}