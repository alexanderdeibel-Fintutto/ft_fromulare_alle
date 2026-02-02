import React from 'react';
import { motion } from 'framer-motion';

/**
 * Loading Skeleton
 * Placeholder while data loads
 */

export function SkeletonLine({ className = '', width = 'w-full' }) {
  return (
    <motion.div
      className={`${width} h-4 bg-gray-200 rounded ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <motion.div
      className={`p-4 bg-white rounded-lg border border-gray-200 ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <SkeletonLine className="mb-3" width="w-3/4" />
      <SkeletonLine className="mb-2" width="w-full" />
      <SkeletonLine width="w-1/2" />
    </motion.div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <SkeletonLine width="w-12" />
          <SkeletonLine width="w-1/3" />
          <SkeletonLine width="w-1/4" />
          <SkeletonLine width="w-1/5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className = '' }) {
  return (
    <motion.div
      className={`w-10 h-10 bg-gray-200 rounded-full ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

export function SkeletonGrid({ columns = 3, items = 6 }) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonLine;