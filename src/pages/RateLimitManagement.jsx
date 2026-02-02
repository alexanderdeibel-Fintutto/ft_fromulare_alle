import React, { useState, useEffect } from 'react';
import { Gauge, RefreshCw, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RateLimitManagement() {
  const [rateLimit, setRateLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadRateLimit();
  }, []);

  const loadRateLimit = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.RateLimit.filter(
        { user_email: currentUser.email },
        null,
        1
      );

      if (data && data.length > 0) {
        setRateLimit(data[0]);
      } else {
        // Create default
        const newLimit = await base44.entities.RateLimit.create({
          user_email: currentUser.email,
          tier: 'free'
        });
        setRateLimit(newLimit);
      }
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLimit = async () => {
    try {
      const response = await base44.functions.invoke('checkRateLimit', {});
      toast.success('Rate Limit geprüft');
      loadRateLimit();
    } catch (err) {
      toast.error(err.response?.data?.reason || 'Rate Limit überschritten');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const minProgress = (rateLimit?.current_usage_minute / rateLimit?.requests_per_minute) * 100;
  const dayProgress = (rateLimit?.current_usage_day / rateLimit?.requests_per_day) * 100;
  const monthProgress = (rateLimit?.current_usage_month / rateLimit?.requests_per_month) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gauge className="w-8 h-8" />
          Rate Limit Management
        </h1>
        <Button onClick={handleCheckLimit} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Prüfen
        </Button>
      </div>

      {rateLimit && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Tier: {rateLimit.tier}</h2>
              <span className="text-sm text-gray-600">
                Überschreitungen: {rateLimit.quota_exceeded_count}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Pro Minute */}
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Pro Minute</p>
              <p className="text-2xl font-bold text-gray-900">
                {rateLimit.current_usage_minute}/{rateLimit.requests_per_minute}
              </p>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    minProgress > 80 ? 'bg-red-500' : minProgress > 50 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(minProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{minProgress.toFixed(0)}% ausgelastet</p>
            </div>

            {/* Pro Tag */}
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Pro Tag</p>
              <p className="text-2xl font-bold text-gray-900">
                {rateLimit.current_usage_day}/{rateLimit.requests_per_day}
              </p>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    dayProgress > 80 ? 'bg-red-500' : dayProgress > 50 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(dayProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{dayProgress.toFixed(0)}% ausgelastet</p>
            </div>

            {/* Pro Monat */}
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Pro Monat</p>
              <p className="text-2xl font-bold text-gray-900">
                {rateLimit.current_usage_month}/{rateLimit.requests_per_month}
              </p>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    monthProgress > 80 ? 'bg-red-500' : monthProgress > 50 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(monthProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{monthProgress.toFixed(0)}% ausgelastet</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">Limite upgraden?</p>
              <p className="text-sm text-blue-700 mt-1">
                Kontaktiere uns für höhere Rate Limits auf deinem Plan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}