import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function DataMigration() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [migrationData, setMigrationData] = useState({
    job_name: '',
    source_system: '',
    migration_type: 'documents'
  });

  const handleStartMigration = async () => {
    if (!migrationData.job_name || !migrationData.source_system) {
      toast.error('Alle Felder erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('executeMigrationJob', migrationData);
      setShowDialog(false);
      setMigrationData({ job_name: '', source_system: '', migration_type: 'documents' });
      toast.success('Migration gestartet');
    } catch (error) {
      toast.error('Fehler beim Starten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Daten-Migration</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Migration starten
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Migriere Daten von Legacy-Systemen</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Migration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job-Name</label>
              <Input
                value={migrationData.job_name}
                onChange={(e) => setMigrationData({ ...migrationData, job_name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quellsystem</label>
              <Input
                value={migrationData.source_system}
                onChange={(e) => setMigrationData({ ...migrationData, source_system: e.target.value })}
                placeholder="z.B. SharePoint, OneDrive"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Migrationstyp</label>
              <select
                value={migrationData.migration_type}
                onChange={(e) => setMigrationData({ ...migrationData, migration_type: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="documents">Dokumente</option>
                <option value="users">Benutzer</option>
                <option value="shares">Shares</option>
              </select>
            </div>
            <Button onClick={handleStartMigration} disabled={loading} className="w-full gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Starten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}