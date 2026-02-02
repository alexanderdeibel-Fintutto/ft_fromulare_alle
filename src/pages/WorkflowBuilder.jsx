import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowBuilder() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState({
    name: '',
    trigger_type: 'document_shared',
    actions: []
  });

  const handleCreateWorkflow = async () => {
    if (!workflowData.name) {
      toast.error('Name erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('createWorkflow', {
        name: workflowData.name,
        trigger_type: workflowData.trigger_type,
        actions: [{ type: 'notify', target: 'email' }],
        conditions: []
      });
      setShowDialog(false);
      setWorkflowData({ name: '', trigger_type: 'document_shared', actions: [] });
      toast.success('Workflow erstellt');
    } catch (error) {
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Workflow Builder</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neuer Workflow
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Automatisiere Aufgaben mit Workflows</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={workflowData.name}
                onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Auslöser</label>
              <select
                value={workflowData.trigger_type}
                onChange={(e) => setWorkflowData({ ...workflowData, trigger_type: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="document_shared">Dokument geteilt</option>
                <option value="document_download">Download</option>
                <option value="share_created">Share erstellt</option>
                <option value="scheduled">Geplant</option>
              </select>
            </div>
            <Button onClick={handleCreateWorkflow} disabled={loading} className="w-full gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}