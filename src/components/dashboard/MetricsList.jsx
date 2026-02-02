import React from 'react';
import { motion } from 'framer-motion';

/**
 * Metrics List
 * List of key metrics with values
 */

export default function MetricsList({ metrics = [], columns = 2 }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className={`grid gap-6 grid-cols-1 md:grid-cols-${columns}`}>
        {metrics.map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
            {metric.change && (
              <p className={`text-xs mt-2 ${
                metric.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change > 0 ? '↑' : '↓'} {Math.abs(metric.change)}% zur Vorwoche
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}