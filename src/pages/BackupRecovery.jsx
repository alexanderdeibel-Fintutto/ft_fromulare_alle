import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, HardDrive, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function BackupRecovery() {
  const [loading, setLoading] = useState(false);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('createBackupSnapshot', {
        backup_type: 'incremental',
        retention_days: 90
      });
      toast.success('Backup erstellt');
    } catch (error) {
      toast.error('Fehler beim Backup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Backup & Recovery</h1>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Automatische Backups
            </h2>
            <p className="text-sm text-gray-600 mt-1">Tägliche inkrementelle Backups mit 90-Tage-Aufbewahrung</p>
          </div>
          <Button onClick={handleCreateBackup} disabled={loading} className="gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Jetzt sichern
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Letzte Backups</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium text-gray-900">Vollständiges Backup</p>
              <p className="text-sm text-gray-600">
                {format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}