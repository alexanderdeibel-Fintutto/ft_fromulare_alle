import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupManagementPage() {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [backupType, setBackupType] = useState('full');

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('createBackup', { backup_type: backupType });
      setShowDialog(false);
      toast.success('Backup erstellt');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Backup Management</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Backup
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Erstelle und verwalte Backups</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Backup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="full">Vollständig</option>
              <option value="incremental">Inkrementell</option>
              <option value="differential">Differentiell</option>
            </select>
            <Button onClick={handleCreateBackup} disabled={loading} className="w-full gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}