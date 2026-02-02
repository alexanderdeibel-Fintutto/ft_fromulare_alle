import React, { useState } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SharedDocumentsBatch({ selectedShares, onClearSelection, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleBatchRevoke = async () => {
    if (!window.confirm(`${selectedShares.length} Freigaben wirklich widerrufen?`)) return;

    setLoading(true);
    try {
      await base44.functions.invoke('batchRevokeShares', {
        share_ids: selectedShares
      });

      toast.success(`${selectedShares.length} Freigaben widerrufen`);
      onClearSelection();
      onSuccess?.();
    } catch (error) {
      toast.error('Fehler beim Widerrufen');
    } finally {
      setLoading(false);
    }
  };

  if (selectedShares.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-blue-900">
          {selectedShares.length} Freigabe{selectedShares.length !== 1 ? 'n' : ''} ausgewählt
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleBatchRevoke}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Alle widerrufen
        </Button>
        <Button
          onClick={onClearSelection}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}