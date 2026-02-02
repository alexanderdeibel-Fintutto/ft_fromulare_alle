import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Users, Zap } from 'lucide-react';

export default function ServiceDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics-dashboard?metric=overview&days=${period}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Laden...</div>;
  }

  if (!analytics) {
    return <div className="p-4 text-center text-red-600">Fehler beim Laden</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map(days => (
          <button
            key={days}
            onClick={() => setPeriod(days)}
            className={`px-4 py-2 rounded ${
              period === days
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {days}d
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Service Calls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Service Calls</p>
                <p className="text-2xl font-bold">{analytics.service_calls.total}</p>
                <p className="text-xs text-green-600">
                  {analytics.service_calls.success_rate}% erfolgreich
                </p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Einnahmen</p>
                <p className="text-2xl font-bold">€{analytics.revenue.total}</p>
                <p className="text-xs text-gray-500">
                  Marge: €{analytics.revenue.margin}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Costs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Kosten</p>
                <p className="text-2xl font-bold">€{analytics.costs.total}</p>
                <p className="text-xs text-gray-500">
                  {analytics.costs.per_call}/Call
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ø Response Time</p>
                <p className="text-2xl font-bold">{analytics.performance.avg_response_time_ms}ms</p>
                <p className="text-xs text-gray-500">
                  {analytics.service_calls.failed} fehlgeschlagen
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Service-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Call Success Rate */}
            <div>
              <h4 className="font-semibold mb-4">Erfolgsrate</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Erfolg', value: analytics.service_calls.succeeded },
                  { name: 'Fehler', value: analytics.service_calls.failed }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cost Breakdown */}
            <div>
              <h4 className="font-semibold mb-4">Kosten pro Call</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Gesamtkosten:</span> €{analytics.costs.total}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Calls:</span> {analytics.service_calls.total}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Durchschnitt:</span> €{analytics.costs.per_call}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Margin:</span> {((analytics.revenue.margin / analytics.revenue.total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}