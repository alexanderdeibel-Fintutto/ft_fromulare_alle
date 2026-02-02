import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

/**
 * Dashboard Card
 * Generic card container with header and actions
 */

export default function DashboardCard({
  title,
  subtitle,
  children,
  actions,
  noPadding = false,
  loading = false
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      {(title || actions) && (
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={noPadding ? '' : 'p-6'}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full" />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}