import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, Palette } from 'lucide-react';
import { toast } from 'sonner';

export default function BrandingManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brandData, setBrandData] = useState({
    brand_name: '',
    primary_color: '#4F46E5',
    secondary_color: '#7C3AED'
  });

  const handleCreate = async () => {
    if (!brandData.brand_name) {
      toast.error('Brand-Name erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('createBrandingPortal', brandData);
      setShowDialog(false);
      setBrandData({ brand_name: '', primary_color: '#4F46E5', secondary_color: '#7C3AED' });
      toast.success('Branding erstellt');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Branding Portal</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Brand
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Erstelle und verwalte Custom Branding Portale</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Branding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand-Name</label>
              <Input
                value={brandData.brand_name}
                onChange={(e) => setBrandData({ ...brandData, brand_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandData.primary_color}
                  onChange={(e) => setBrandData({ ...brandData, primary_color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={brandData.primary_color}
                  onChange={(e) => setBrandData({ ...brandData, primary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandData.secondary_color}
                  onChange={(e) => setBrandData({ ...brandData, secondary_color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={brandData.secondary_color}
                  onChange={(e) => setBrandData({ ...brandData, secondary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
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