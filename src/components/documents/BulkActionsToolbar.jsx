import React from 'react';
import { Download, Trash2, Archive, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BulkActionsToolbar({
  selectedCount,
  onExport,
  onDelete,
  onArchive,
  onShare,
  loading
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
      <p className="text-sm font-medium text-blue-900">
        {selectedCount} Dokument(e) ausgewählt
      </p>
      <div className="flex gap-2">
        {onExport && (
          <Button
            onClick={onExport}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportieren
          </Button>
        )}
        {onShare && (
          <Button
            onClick={onShare}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Teilen
          </Button>
        )}
        {onArchive && (
          <Button
            onClick={onArchive}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            Archivieren
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={onDelete}
            disabled={loading}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Löschen
          </Button>
        )}
      </div>
    </div>
  );
}