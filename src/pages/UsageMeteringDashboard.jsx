import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function UsageMeteringDashboard() {
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadMeters();
  }, []);

  const loadMeters = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.UsageMetering.filter(
        { user_email: currentUser.email },
        null,
        50
      );

      setMeters(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const totalOverageCost = meters.reduce((sum, m) => sum + (m.overage_cost_cents || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="w-8 h-8" />
          Usage Metering
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Meters</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{meters.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Overage Kosten</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            €{(totalOverageCost / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Mit Limits</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {meters.filter(m => m.overage_usage > 0).length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {meters.map(meter => {
          const usagePercent = (meter.current_usage / (meter.limit || 1)) * 100;
          const overLimit = meter.current_usage > (meter.limit || 1);

          return (
            <div key={meter.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-gray-900 capitalize">
                  {meter.meter_name}
                </h3>
                {overLimit && (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">
                    {meter.current_usage.toFixed(0)} {meter.unit}
                  </span>
                  <span className="text-gray-600">
                    Limit: {meter.limit} {meter.unit}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${
                      overLimit ? 'bg-red-500' : usagePercent > 80 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </div>

              {meter.overage_usage > 0 && (
                <div className="bg-orange-50 rounded p-3 text-sm">
                  <p className="text-orange-900 font-medium">
                    Overage: {meter.overage_usage.toFixed(0)} {meter.unit}
                  </p>
                  <p className="text-orange-800 mt-1">
                    Kosten: €{(meter.overage_cost_cents / 100).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}