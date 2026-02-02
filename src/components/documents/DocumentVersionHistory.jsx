import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { History, RotateCcw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentVersionHistory({ documentId }) {
  const { data: versions = [], refetch } = useQuery({
    queryKey: ['documentVersions', documentId],
    queryFn: async () => {
      const v = await base44.entities.DocumentVersion.filter({
        document_id: documentId
      }, '-created_date');
      return v || [];
    }
  });

  const handleRollback = async (versionId) => {
    if (!window.confirm('Zu dieser Version zurückgehen?')) return;

    try {
      await base44.functions.invoke('rollbackDocumentVersion', {
        version_id: versionId
      });
      await refetch();
      toast.success('Zurückgesetzt');
    } catch (error) {
      toast.error('Rollback fehlgeschlagen');
    }
  };

  if (versions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Keine Versionshistorie</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((version, idx) => (
        <Card key={version.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">Version {version.version_number}</span>
                {version.is_current && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Aktuell</span>
                )}
              </div>
              <p className="text-sm text-gray-600">{version.change_summary}</p>
              <p className="text-xs text-gray-500 mt-1">
                {version.created_by} • {format(new Date(version.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(version.file_url)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
              </Button>
              {version.rollback_available && !version.is_current && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRollback(version.id)}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Zurück
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}