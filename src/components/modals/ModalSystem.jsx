import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal System
 * Global modal management with context
 */

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modals, setModals] = useState([]);

  const openModal = useCallback((id, config) => {
    setModals(prev => {
      const exists = prev.find(m => m.id === id);
      if (exists) return prev;
      return [...prev, { id, ...config }];
    });
  }, []);

  const closeModal = useCallback((id) => {
    setModals(prev => prev.filter(m => m.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    setModals([]);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeAll }}>
      {children}
      <ModalRenderer modals={modals} onClose={closeModal} />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}

function ModalRenderer({ modals, onClose }) {
  return (
    <AnimatePresence>
      {modals.map(modal => (
        <Modal
          key={modal.id}
          {...modal}
          onClose={() => onClose(modal.id)}
        />
      ))}
    </AnimatePresence>
  );
}

function Modal({
  id,
  title,
  content,
  actions,
  onClose,
  size = 'md',
  closeButton = true
}) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {closeButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {typeof content === 'function' ? content({ close: onClose }) : content}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.onClick?.();
                  if (action.closeOnClick !== false) onClose();
                }}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}