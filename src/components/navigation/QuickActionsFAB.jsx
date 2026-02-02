import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, FileText, Settings, Zap } from 'lucide-react';
import { createPageUrl } from '@/utils/createPageUrl';

/**
 * Quick Actions Floating Action Button
 * Fast access to common actions
 */

const ACTIONS = [
  {
    id: 'compose',
    label: 'Neue Nachricht',
    icon: MessageSquare,
    href: createPageUrl('MessagingCenter'),
    color: 'bg-blue-500'
  },
  {
    id: 'document',
    label: 'Neues Dokument',
    icon: FileText,
    href: createPageUrl('MeineDokumente'),
    color: 'bg-green-500'
  },
  {
    id: 'settings',
    label: 'Einstellungen',
    icon: Settings,
    href: createPageUrl('Settings'),
    color: 'bg-gray-500'
  },
  {
    id: 'upgrade',
    label: 'Upgrade',
    icon: Zap,
    href: createPageUrl('Billing'),
    color: 'bg-purple-500'
  }
];

export default function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 space-y-3"
          >
            {ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.a
                  key={action.id}
                  href={action.href}
                  initial={{ opacity: 0, scale: 0.5, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${action.color} text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {action.label}
                  </span>
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}