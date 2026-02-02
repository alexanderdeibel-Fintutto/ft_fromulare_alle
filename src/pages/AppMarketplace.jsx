import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function AppMarketplace() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appData, setAppData] = useState({
    app_name: '',
    category: 'productivity',
    description: '',
    repository_url: ''
  });

  const handlePublish = async () => {
    if (!appData.app_name) {
      toast.error('App-Name erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('publishMarketplaceApp', appData);
      setShowDialog(false);
      setAppData({ app_name: '', category: 'productivity', description: '', repository_url: '' });
      toast.success('App veröffentlicht');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">App Marketplace</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          App
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Veröffentliche und entdecke Apps</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>App veröffentlichen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">App-Name</label>
              <Input
                value={appData.app_name}
                onChange={(e) => setAppData({ ...appData, app_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategorie</label>
              <select
                value={appData.category}
                onChange={(e) => setAppData({ ...appData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="productivity">Produktivität</option>
                <option value="integration">Integration</option>
                <option value="analytics">Analytics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Repository URL</label>
              <Input
                value={appData.repository_url}
                onChange={(e) => setAppData({ ...appData, repository_url: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
            <Button onClick={handlePublish} disabled={loading} className="w-full gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Veröffentlichen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}