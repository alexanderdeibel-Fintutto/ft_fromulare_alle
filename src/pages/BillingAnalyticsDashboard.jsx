import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BillingAnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin access required');
        return;
      }
      setUser(currentUser);

      await base44.functions.invoke('calculateBillingMetrics', {});

      const data = await base44.entities.BillingMetrics.filter(
        {},
        '-metric_date',
        1
      );

      if (data && data.length > 0) {
        setMetrics(data[0]);
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
          Billing Analytics
        </h1>
        <Button onClick={loadMetrics} className="bg-blue-600 hover:bg-blue-700">
          Refresh
        </Button>
      </div>

      {metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                €{(metrics.total_revenue_cents / 100).toLocaleString('de-DE')}
              </p>
              <p className="text-xs text-gray-500 mt-2">{metrics.total_invoices} invoices</p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                €{(metrics.collected_revenue_cents / 100).toLocaleString('de-DE')}
              </p>
              <p className="text-xs text-gray-500 mt-2">{metrics.paid_invoices} paid</p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                €{(metrics.pending_revenue_cents / 100).toLocaleString('de-DE')}
              </p>
              <p className="text-xs text-gray-500 mt-2">{metrics.pending_invoices} invoices</p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {metrics.invoice_success_rate_percent?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-2">{metrics.overdue_invoices} overdue</p>
            </div>
          </div>

          {metrics.overdue_revenue_cents > 0 && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-6 flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-red-900">Outstanding Invoices</p>
                <p className="text-sm text-red-700 mt-1">
                  €{(metrics.overdue_revenue_cents / 100).toLocaleString('de-DE')} overdue
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-bold text-gray-900 mb-4">Invoice Breakdown</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-gray-600">Total Invoices</span>
                <span className="font-bold text-gray-900">{metrics.total_invoices}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-gray-600">Paid</span>
                <span className="font-bold text-green-600">{metrics.paid_invoices}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-gray-600">Pending</span>
                <span className="font-bold text-orange-600">{metrics.pending_invoices}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-gray-600">Overdue</span>
                <span className="font-bold text-red-600">{metrics.overdue_invoices}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}