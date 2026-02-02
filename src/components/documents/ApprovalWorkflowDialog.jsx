import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ApprovalWorkflowDialog({ isOpen, onClose, documentId }) {
  const [approvers, setApprovers] = useState(['']);
  const [recipient, setRecipient] = useState('');
  const [accessLevel, setAccessLevel] = useState('download');
  const [loading, setLoading] = useState(false);

  const addApprover = () => setApprovers([...approvers, '']);
  const removeApprover = (idx) => setApprovers(approvers.filter((_, i) => i !== idx));
  const updateApprover = (idx, val) => {
    const updated = [...approvers];
    updated[idx] = val;
    setApprovers(updated);
  };

  const handleCreate = async () => {
    if (!recipient || approvers.some(a => !a.trim())) {
      toast.error('Alle Felder erforderlich');
      return;
    }

    setLoading(true);
    try {
      const { base44 } = await import('@/api/base44Client');
      await base44.functions.invoke('initiateCrossAppShareWorkflow', {
        document_id: documentId,
        recipient_email: recipient,
        approvers: approvers.filter(a => a.trim()),
        access_level: accessLevel
      });

      toast.success('Genehmigungsworkflow gestartet');
      onClose();
    } catch (error) {
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Genehmigungsworkflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Empfänger</label>
            <Input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Genehmiger</label>
            {approvers.map((approver, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Input
                  type="email"
                  value={approver}
                  onChange={(e) => updateApprover(idx, e.target.value)}
                  disabled={loading}
                />
                {approvers.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeApprover(idx)}
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addApprover}
              disabled={loading}
              className="gap-2 w-full"
            >
              <Plus className="w-4 h-4" />
              Genehmiger hinzufügen
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Zugriffslevel</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              disabled={loading}
            >
              <option value="view">Anzeigen</option>
              <option value="download">Download</option>
              <option value="edit">Bearbeiten</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" disabled={loading} className="flex-1">
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={loading} className="flex-1 gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Starten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}