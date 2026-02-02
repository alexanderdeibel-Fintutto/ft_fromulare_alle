import React from 'react';
import { useRealtimeShares } from '@/components/hooks/useRealtimeShares';
import { Loader, Trash2, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function RealtimeShareList({ documentId }) {
  const { shares, loading } = useRealtimeShares(documentId);
  const [copiedId, setCopiedId] = React.useState(null);

  const copyShareLink = async (shareId) => {
    const link = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(shareId);
    toast.success('Link kopiert');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>;
  }

  if (shares.length === 0) {
    return <div className="text-center py-8 text-gray-500">Noch nicht geteilt</div>;
  }

  return (
    <div className="space-y-2">
      {shares.map(share => (
        <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{share.shared_with_email}</p>
            <p className="text-xs text-gray-500">
              {share.access_level} • Geteilt {format(new Date(share.shared_at), 'dd.MM.yyyy', { locale: de })}
            </p>
            {share.expires_at && (
              <p className="text-xs text-orange-600">
                Läuft ab: {format(new Date(share.expires_at), 'dd.MM.yyyy', { locale: de })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyShareLink(share.id)}
              className="gap-2"
            >
              {copiedId === share.id ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}