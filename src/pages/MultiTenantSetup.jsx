import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MultiTenantSetup() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tenantData, setTenantData] = useState({
    tenant_name: '',
    subdomain: '',
    max_users: 100
  });

  const handleCreate = async () => {
    if (!tenantData.tenant_name) {
      toast.error('Tenant-Name erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('setupMultiTenant', tenantData);
      setShowDialog(false);
      setTenantData({ tenant_name: '', subdomain: '', max_users: 100 });
      toast.success('Tenant erstellt');
    } catch (error) {
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant Setup</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tenant
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Erstelle isolierte Tenant-Umgebungen</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={tenantData.tenant_name}
                onChange={(e) => setTenantData({ ...tenantData, tenant_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subdomain</label>
              <Input
                value={tenantData.subdomain}
                onChange={(e) => setTenantData({ ...tenantData, subdomain: e.target.value })}
                placeholder="tenant-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Users</label>
              <Input
                type="number"
                value={tenantData.max_users}
                onChange={(e) => setTenantData({ ...tenantData, max_users: parseInt(e.target.value) })}
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