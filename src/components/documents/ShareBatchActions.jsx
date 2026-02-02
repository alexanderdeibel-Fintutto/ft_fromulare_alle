import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Trash2, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareBatchActions({ selectedShares, onRevoke }) {
  const [loading, setLoading] = useState(false);

  const handleBatchRevoke = async () => {
    if (selectedShares.length === 0) {
      toast.error('Keine Shares ausgewählt');
      return;
    }

    if (!window.confirm(`${selectedShares.length} Share(s) wirklich widerrufen?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('batchRevokeShares', {
        share_ids: Array.from(selectedShares)
      });

      toast.success(`${response.data.revoked} Share(s) widerrufen`);
      if (response.data.failed > 0) {
        toast.error(`${response.data.failed} fehlgeschlagen`);
      }
      onRevoke();
    } catch (err) {
      toast.error('Batch Revoke fehlgeschlagen');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedShares.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
      <span className="text-sm font-medium text-blue-900">
        {selectedShares.size} Share(s) ausgewählt
      </span>
      <Button
        onClick={handleBatchRevoke}
        disabled={loading}
        variant="destructive"
        size="sm"
        className="gap-2"
      >
        {loading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        Widerrufen
      </Button>
    </div>
  );
}