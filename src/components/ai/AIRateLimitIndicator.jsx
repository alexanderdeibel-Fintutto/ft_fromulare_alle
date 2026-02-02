import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock } from 'lucide-react';

export default function AIRateLimitIndicator({ userId, className = '' }) {
  const [rateLimit, setRateLimit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      checkRateLimit();
    }
  }, [userId]);

  async function checkRateLimit() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const [logs, settingsList] = await Promise.all([
        base44.entities.AIUsageLog.filter({
          user_email: userId,
          created_date: { $gte: oneHourAgo.toISOString() }
        }),
        base44.entities.AISettings.list()
      ]);
      
      const settings = settingsList?.[0];
      const limit = settings?.rate_limit_per_user_hour || 20;
      const used = logs?.length || 0;
      const remaining = Math.max(0, limit - used);

      setRateLimit({ remaining, limit, used });
    } catch (error) {
      console.error('Failed to check rate limit:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !rateLimit) return null;

  const percent = (rateLimit.used / rateLimit.limit) * 100;
  const isLow = percent >= 80;

  return (
    <div className={`flex items-center gap-2 text-sm ${isLow ? 'text-orange-600' : 'text-gray-600'} ${className}`}>
      <Clock className="w-4 h-4" />
      <span>
        Noch <strong>{rateLimit.remaining}</strong> Anfragen diese Stunde
      </span>
    </div>
  );
}