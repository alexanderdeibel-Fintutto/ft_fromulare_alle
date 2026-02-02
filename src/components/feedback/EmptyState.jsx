import React from 'react';
import { motion } from 'framer-motion';
import { InboxIcon, AlertCircle, Search } from 'lucide-react';

/**
 * Empty State
 * Friendly message when no data available
 */

const ICONS = {
  inbox: InboxIcon,
  error: AlertCircle,
  search: Search
};

export default function EmptyState({ 
  icon = 'inbox',
  title = 'Keine Daten',
  description = 'Es gibt noch keine Inhalte zu zeigen',
  action,
  className = ''
}) {
  const Icon = ICONS[icon] || ICONS.inbox;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mb-6"
      >
        <Icon className="w-16 h-16 text-gray-300" />
      </motion.div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 text-center max-w-sm">{description}</p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}