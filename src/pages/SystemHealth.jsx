import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('checkSystemHealth', {});
      setHealth(result.data);
      toast.success('Gesundheitsstatus aktualisiert');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
        <Button onClick={handleCheck} disabled={loading} className="gap-2">
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          <Activity className="w-4 h-4" />
          Prüfen
        </Button>
      </div>

      {health && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">CPU</p>
            <p className="text-2xl font-bold text-gray-900">{health.cpu_usage.toFixed(1)}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Memory</p>
            <p className="text-2xl font-bold text-gray-900">{health.memory_usage.toFixed(1)}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Disk</p>
            <p className="text-2xl font-bold text-gray-900">{health.disk_usage.toFixed(1)}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Response Time</p>
            <p className="text-2xl font-bold text-gray-900">{health.response_time_ms}ms</p>
          </Card>
        </div>
      )}
    </div>
  );
}