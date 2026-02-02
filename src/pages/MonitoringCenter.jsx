import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function MonitoringCenter() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState({
    alert_name: '',
    metric_type: 'cpu',
    threshold: 80
  });

  const handleCreate = async () => {
    if (!alertData.alert_name) {
      toast.error('Name erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('createMonitoringAlert', alertData);
      setShowDialog(false);
      setAlertData({ alert_name: '', metric_type: 'cpu', threshold: 80 });
      toast.success('Alert erstellt');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Monitoring & Alerts</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Alert
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Aktive Metriken
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-blue-600 font-medium">CPU</p>
            <p className="text-blue-900">45%</p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-green-600 font-medium">Memory</p>
            <p className="text-green-900">62%</p>
          </div>
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={alertData.alert_name}
                onChange={(e) => setAlertData({ ...alertData, alert_name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Metrik</label>
              <select
                value={alertData.metric_type}
                onChange={(e) => setAlertData({ ...alertData, metric_type: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="cpu">CPU</option>
                <option value="memory">Memory</option>
                <option value="disk">Disk</option>
                <option value="error_rate">Error Rate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Threshold</label>
              <input
                type="number"
                value={alertData.threshold}
                onChange={(e) => setAlertData({ ...alertData, threshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}