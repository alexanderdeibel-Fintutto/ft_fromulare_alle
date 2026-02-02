import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Users, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SubscriptionAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin access required');
        return;
      }
      setUser(currentUser);

      const response = await base44.functions.invoke('generateAnalytics', {
        analytics_type: 'subscription'
      });

      const data = await base44.entities.SubscriptionAnalytics.filter(
        {},
        '-analytics_date',
        1
      );

      if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Subscription Analytics
        </h1>
        <Button onClick={loadAnalytics} className="bg-blue-600 hover:bg-blue-700">
          Refresh
        </Button>
      </div>

      {analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {analytics.total_active_subscriptions}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-300" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    €{(analytics.mrr_cents / 100).toLocaleString('de-DE')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-300" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Annual Revenue</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    €{(analytics.arr_cents / 100).toLocaleString('de-DE')}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-300" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {analytics.retention_rate_percent?.toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-300" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-bold text-gray-900 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="pb-4 border-b flex justify-between">
                <span className="text-gray-600">New Subscriptions (Today)</span>
                <span className="font-bold text-gray-900">{analytics.new_subscriptions_count}</span>
              </div>
              <div className="pb-4 border-b flex justify-between">
                <span className="text-gray-600">Churn Rate</span>
                <span className="font-bold text-gray-900">{analytics.churn_rate_percent?.toFixed(2)}%</span>
              </div>
              <div className="pb-4 border-b flex justify-between">
                <span className="text-gray-600">Expansion Rate</span>
                <span className="font-bold text-gray-900">{analytics.expansion_rate_percent?.toFixed(2)}%</span>
              </div>
              <div className="pb-4 border-b flex justify-between">
                <span className="text-gray-600">NPS Score</span>
                <span className="font-bold text-gray-900">{analytics.nps_score || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}