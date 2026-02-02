import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function APIGatewayManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gatewayData, setGatewayData] = useState({
    endpoint_name: '',
    path: '',
    rate_limit_requests: 1000
  });

  const handleCreate = async () => {
    if (!gatewayData.endpoint_name || !gatewayData.path) {
      toast.error('Name und Path erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('configureAPIGateway', gatewayData);
      setShowDialog(false);
      setGatewayData({ endpoint_name: '', path: '', rate_limit_requests: 1000 });
      toast.success('Gateway konfiguriert');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">API Gateway</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Endpoint
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Verwalte API-Endpoints und Rate Limiting</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Endpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={gatewayData.endpoint_name}
                onChange={(e) => setGatewayData({ ...gatewayData, endpoint_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Path</label>
              <Input
                value={gatewayData.path}
                onChange={(e) => setGatewayData({ ...gatewayData, path: e.target.value })}
                placeholder="/api/v1/documents"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rate Limit (req/h)</label>
              <Input
                type="number"
                value={gatewayData.rate_limit_requests}
                onChange={(e) => setGatewayData({ ...gatewayData, rate_limit_requests: parseInt(e.target.value) })}
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