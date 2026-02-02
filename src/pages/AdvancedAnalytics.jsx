import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedAnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    analytics_name: '',
    metric_type: 'user'
  });

  const handleCreate = async () => {
    if (!analyticsData.analytics_name) {
      toast.error('Name erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('generateAnalyticsReport', analyticsData);
      setShowDialog(false);
      setAnalyticsData({ analytics_name: '', metric_type: 'user' });
      toast.success('Analytics erstellt');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Analytics
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Erstelle detaillierte Analysen</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={analyticsData.analytics_name}
                onChange={(e) => setAnalyticsData({ ...analyticsData, analytics_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Metric Type</label>
              <select
                value={analyticsData.metric_type}
                onChange={(e) => setAnalyticsData({ ...analyticsData, metric_type: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="user">Benutzer</option>
                <option value="document">Dokumente</option>
                <option value="share">Shares</option>
                <option value="engagement">Engagement</option>
                <option value="revenue">Umsatz</option>
              </select>
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