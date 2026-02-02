import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const COLORS = ['#4F46E5', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];

export default function ShareAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getUserShareAnalytics', {
        days: parseInt(timeRange)
      });
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      if (!analytics) return;
      
      const csv = [
        ['Dokument', 'Downloads', 'Unique Users', 'Shares', 'Avg. Time'].join(','),
        ...analytics.documents.map(d => [
          d.title,
          d.downloads,
          d.unique_users,
          d.shares,
          d.avg_time
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `share-analytics-${Date.now()}.csv`;
      a.click();
      toast.success('Exportiert');
    } catch (error) {
      toast.error('Export fehlgeschlagen');
    }
  };

  if (loading) return <div className="text-center py-12">Lädt...</div>;
  if (!analytics) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Share Analytics</h1>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="7">7 Tage</option>
            <option value="30">30 Tage</option>
            <option value="90">90 Tage</option>
          </select>
          <Button onClick={exportAnalytics} className="gap-2">
            <Download className="w-4 h-4" />
            Exportieren
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamt Downloads</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.total_downloads}</p>
            </div>
            <Download className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Users</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.unique_users}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktive Shares</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.active_shares}</p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Conversions</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.conversion_rate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.download_trend && analytics.download_trend.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.download_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="downloads" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {analytics.access_level_breakdown && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Zugriff nach Level</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.access_level_breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.access_level_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Documents Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Dokumente</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-4">Dokument</th>
                <th className="text-right py-2 px-4">Downloads</th>
                <th className="text-right py-2 px-4">Unique Users</th>
                <th className="text-right py-2 px-4">Shares</th>
                <th className="text-right py-2 px-4">Ø Zeit (s)</th>
              </tr>
            </thead>
            <tbody>
              {analytics.documents?.map(doc => (
                <tr key={doc.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{doc.title}</td>
                  <td className="text-right py-3 px-4">{doc.downloads}</td>
                  <td className="text-right py-3 px-4">{doc.unique_users}</td>
                  <td className="text-right py-3 px-4">{doc.shares}</td>
                  <td className="text-right py-3 px-4">{doc.avg_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}