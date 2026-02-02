import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PerformanceMonitoring() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.PerformanceMetric.filter(
        {},
        '-metric_timestamp',
        50
      );

      setMetrics(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectMetrics = async () => {
    try {
      await base44.functions.invoke('collectPerformanceMetrics', {
        service_name: 'api'
      });

      toast.success('Metriken gesammelt');
      loadMetrics();
    } catch (err) {
      toast.error('Fehler beim Sammeln');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const groupedMetrics = metrics.reduce((acc, m) => {
    if (!acc[m.metric_type]) acc[m.metric_type] = [];
    acc[m.metric_type].push(m);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="w-8 h-8" />
          Performance Monitoring
        </h1>
        <Button onClick={handleCollectMetrics} className="bg-blue-600 hover:bg-blue-700">
          <Zap className="w-4 h-4 mr-2" />
          Jetzt aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(groupedMetrics).map(([type, values]) => {
          const latest = values[0];
          return (
            <div key={type} className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {latest?.value.toFixed(1)}{latest?.unit}
              </p>
              <p className={`text-xs font-medium mt-2 capitalize ${
                latest?.status === 'healthy' ? 'text-green-600' :
                latest?.status === 'warning' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {latest?.status}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Zeit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Metrik</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Wert</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.slice(0, 20).map(metric => (
              <tr key={metric.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-700">
                  {new Date(metric.metric_timestamp).toLocaleTimeString('de-DE')}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 capitalize">
                  {metric.metric_type.replace('_', ' ')}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  {metric.value.toFixed(2)}{metric.unit}
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                    metric.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    metric.status === 'warning' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {metric.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}