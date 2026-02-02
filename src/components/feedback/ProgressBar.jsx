import React from 'react';
import { motion } from 'framer-motion';

/**
 * Progress Bar
 * Visual progress indicator with animations
 */

export default function ProgressBar({ 
  value = 0, 
  max = 100,
  showLabel = true,
  color = 'bg-indigo-600',
  size = 'md',
  className = ''
}) {
  const percentage = (value / max) * 100;

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`${color} h-full rounded-full transition-all duration-500`}
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 50 }}
        />
      </div>

      {showLabel && (
        <div className="mt-1 text-xs text-gray-600 font-medium">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}