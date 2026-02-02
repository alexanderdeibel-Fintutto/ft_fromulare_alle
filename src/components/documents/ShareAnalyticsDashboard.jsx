import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader, AlertCircle, Download, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareAnalyticsDashboard({ shareId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [shareId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getShareAnalytics', {
        share_id: shareId,
        days: 30
      });
      setAnalytics(response.data);
    } catch (err) {
      setError(err.message);
      toast.error('Analytics konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-900">Fehler</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  // Prepare chart data
  const chartData = Object.entries(analytics.downloads_by_day || {})
    .map(([date, count]) => ({
      date: format(new Date(date), 'dd.MM'),
      downloads: count
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const isExpired = analytics.expires_at && new Date(analytics.expires_at) < new Date();
  const isActive = analytics.is_active && !isExpired;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{analytics.document_title}</h3>
        <p className="text-sm text-gray-600">
          geteilt mit {analytics.shared_with} • {analytics.access_level}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Status: {isActive ? '✓ Aktiv' : '✗ Inaktiv'}
          {isExpired && ' (abgelaufen)'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{analytics.total_downloads}</p>
              <p className="text-sm text-blue-700">Downloads</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-900">{analytics.unique_downloaders}</p>
              <p className="text-sm text-purple-700">Unterschiedliche Nutzer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2 text-sm">
        {analytics.first_download && (
          <p className="text-gray-600">
            Erstes Download: {format(new Date(analytics.first_download), 'dd.MM.yyyy HH:mm')}
          </p>
        )}
        {analytics.last_download && (
          <p className="text-gray-600">
            Letztes Download: {format(new Date(analytics.last_download), 'dd.MM.yyyy HH:mm')}
          </p>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-4">Downloads nach Tag</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="downloads" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}