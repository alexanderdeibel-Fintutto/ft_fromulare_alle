import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function MetricsDashboard() {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const handleCapture = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('captureMetricsSnapshot', {});
      setMetrics(result.data);
      toast.success('Metriken erfasst');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Metrics Dashboard</h1>
        <Button onClick={handleCapture} disabled={loading} className="gap-2">
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          <Activity className="w-4 h-4" />
          Erfassen
        </Button>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Benutzer</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.total_users}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Dokumentе</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.total_documents}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Speicher</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.storage_used_gb} GB</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Uptime</p>
            <p className="text-2xl font-bold text-green-600">{metrics.uptime_percent}%</p>
          </Card>
        </div>
      )}
    </div>
  );
}