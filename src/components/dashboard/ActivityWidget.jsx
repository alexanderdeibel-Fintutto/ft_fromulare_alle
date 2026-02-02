import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, MessageSquare, CheckCircle } from 'lucide-react';

/**
 * Activity Widget
 * Shows recent activities
 */

export default function ActivityWidget({ activities = [], maxItems = 5 }) {
  const iconMap = {
    user: User,
    message: MessageSquare,
    check: CheckCircle
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitäten</h3>

      <div className="space-y-3">
        {activities.slice(0, maxItems).map((activity, idx) => {
          const Icon = iconMap[activity.icon] || Clock;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
            >
              <Icon className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                )}
              </div>

              <p className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</p>
            </motion.div>
          );
        })}
      </div>

      {activities.length === 0 && (
        <p className="text-center text-gray-500 py-8">Keine Aktivitäten</p>
      )}
    </div>
  );
}