import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Stat Card
 * Displays a single statistic with trend
 */

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  onClick
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  const isPositive = trend && trend > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`p-6 rounded-lg border ${colorMap[color]} cursor-pointer transition-all ${
        onClick ? 'hover:shadow-lg' : ''
      }`}
    >
      {/* Icon */}
      {Icon && <Icon className="w-8 h-8 mb-3 opacity-75" />}

      {/* Label */}
      <p className="text-sm font-medium opacity-75">{label}</p>

      {/* Value */}
      <p className="text-3xl font-bold mt-2">{value}</p>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3 text-sm">
          <TrendIcon className={`w-4 h-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(trend)}%
          </span>
          <span className="opacity-60">{trendLabel}</span>
        </div>
      )}
    </motion.div>
  );
}