import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

/**
 * Status Badge für Nachrichten
 * sent -> delivered -> read
 */
export default function MessageStatusBadge({ status, size = 'sm' }) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  const statusConfig = {
    sending: {
      icon: Clock,
      color: 'text-gray-400',
      label: 'Wird gesendet...',
    },
    sent: {
      icon: Check,
      color: 'text-gray-400',
      label: 'Gesendet',
    },
    delivered: {
      icon: CheckCheck,
      color: 'text-gray-400',
      label: 'Zugestellt',
    },
    read: {
      icon: CheckCheck,
      color: 'text-blue-500',
      label: 'Gelesen',
    },
    failed: {
      icon: AlertCircle,
      color: 'text-red-500',
      label: 'Fehlgeschlagen',
    },
  };

  const config = statusConfig[status] || statusConfig.sent;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1" title={config.label}>
      <Icon className={`${iconSize} ${config.color}`} />
    </div>
  );
}