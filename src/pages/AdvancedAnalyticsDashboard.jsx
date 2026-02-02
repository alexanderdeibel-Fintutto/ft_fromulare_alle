import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedAnalyticsDashboard() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('monthly'); // daily, weekly, monthly
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const { data: metrics } = useQuery({
    queryKey: ['advancedMetrics', user?.email, timeRange],
    queryFn: async () => {
      if (!user?.email) return [];
      const data = await base44.entities.AdvancedAnalytics.filter({
        user_email: user.email,
        time_period: timeRange,
      }, '-created_date', 50);
      return data || [];
    },
    enabled: !!user?.email,
  });

  const handleExport = async () => {
    try {
      const csv = generateCSV(metrics);
      downloadCSV(csv, `analytics-${timeRange}.csv`);
      toast.success('Analytics exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  };

  const generateCSV = (data) => {
    if (!data || data.length === 0) return 'No data available';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const chartData = metrics?.map(m => ({
    date: m.analytics_name || 'Unknown',
    value: m.data_points?.[0]?.value || 0,
  })) || [];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Advanced Analytics</h1>
            <p className="text-gray-600 mt-2">Track detailed metrics and insights</p>
          </div>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-8">
          {['daily', 'weekly', 'monthly'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
              className="capitalize"
            >
              {range}
            </Button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#4F46E5" name="Value" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#7C3AED" name="Value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics && metrics.length > 0 ? (
                metrics.map((metric, idx) => (
                  <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-gray-900">{metric.analytics_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{metric.metric_type}</p>
                    {metric.insights && metric.insights.length > 0 && (
                      <ul className="text-sm text-gray-700 mt-2 space-y-1">
                        {metric.insights.map((insight, i) => (
                          <li key={i}>• {insight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No analytics data available yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}