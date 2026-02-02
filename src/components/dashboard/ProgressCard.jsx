import React from 'react';
import { motion } from 'framer-motion';

/**
 * Progress Card
 * Shows progress with animated bar
 */

export default function ProgressCard({
  label,
  value,
  max = 100,
  color = 'blue',
  showPercent = true,
  description
}) {
  const percent = Math.round((value / max) * 100);

  const colorMap = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {showPercent && (
          <span className="text-sm font-semibold text-gray-700">{percent}%</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full ${colorMap[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}

      <p className="text-xs text-gray-600 mt-3">
        {value} von {max}
      </p>
    </div>
  );
}