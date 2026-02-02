import React from 'react';
import { motion } from 'framer-motion';
import StatCard from './StatCard';

/**
 * Stats Grid
 * Responsive grid layout for stat cards
 */

export default function StatsGrid({ stats, columns = 4 }) {
  return (
    <motion.div
      className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} xl:grid-cols-${columns}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </motion.div>
  );
}