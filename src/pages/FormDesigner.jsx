import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, FormInput } from 'lucide-react';
import { toast } from 'sonner';

export default function FormDesigner() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    form_name: '',
    response_email: ''
  });

  const handleCreate = async () => {
    if (!formData.form_name) {
      toast.error('Formularname erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('createFormTemplate', {
        ...formData,
        form_fields: [
          { name: 'email', type: 'email', required: true },
          { name: 'message', type: 'textarea', required: true }
        ]
      });
      setShowDialog(false);
      setFormData({ form_name: '', response_email: '' });
      toast.success('Formular erstellt');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Form Designer</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Formular
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Erstelle interaktive Formulare ohne Code</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neues Formular</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Formularname</label>
              <Input
                value={formData.form_name}
                onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Response Email</label>
              <Input
                type="email"
                value={formData.response_email}
                onChange={(e) => setFormData({ ...formData, response_email: e.target.value })}
                placeholder="kontakt@example.com"
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