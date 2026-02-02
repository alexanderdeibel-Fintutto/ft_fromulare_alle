import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileText, Share2, Zap } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const data = await base44.entities.AnalyticsMetric.filter({
        user_email: currentUser.email,
        time_period: selectedPeriod
      }, '-timestamp', 100);
      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const aggregateMetrics = () => {
    const agg = {
      documents_created: 0,
      documents_shared: 0,
      api_calls: 0,
      search_queries: 0
    };
    
    metrics.forEach(m => {
      agg[m.metric_type] = (agg[m.metric_type] || 0) + m.metric_value;
    });
    
    return agg;
  };

  const chartData = metrics
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(m => ({
      timestamp: new Date(m.timestamp).toLocaleDateString(),
      [m.metric_type]: m.metric_value
    }));

  const totals = aggregateMetrics();
  const stats = [
    { label: 'Documents Created', value: totals.documents_created, icon: FileText, color: 'text-blue-600' },
    { label: 'Documents Shared', value: totals.documents_shared, icon: Share2, color: 'text-green-600' },
    { label: 'API Calls', value: totals.api_calls, icon: Zap, color: 'text-purple-600' },
    { label: 'Search Queries', value: totals.search_queries, icon: TrendingUp, color: 'text-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Detailed usage insights and performance metrics</p>
        </div>

        <div className="flex gap-2 mb-6">
          {['daily', 'weekly', 'monthly'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Metrics Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="documents_created" stroke="#3b82f6" />
                    <Line type="monotone" dataKey="documents_shared" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="api_calls" fill="#8b5cf6" />
                    <Bar dataKey="search_queries" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}