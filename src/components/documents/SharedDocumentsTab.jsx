import React from 'react';
import { useSharedDocuments } from '@/components/hooks/useSharedDocuments';
import { Download, RotateCcw, Share2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ACCESS_LABELS = {
  view: 'Nur ansehen',
  download: 'Herunterladen',
  edit: 'Bearbeiten'
};

const ACCESS_COLORS = {
  view: 'bg-blue-100 text-blue-800',
  download: 'bg-green-100 text-green-800',
  edit: 'bg-purple-100 text-purple-800'
};

export default function SharedDocumentsTab() {
  const { documents, loading, revokeShare } = useSharedDocuments();

  const handleDownload = (document) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const handleRevoke = async (shareId) => {
    try {
      await revokeShare(shareId);
      toast.success('Freigabe widerrufen');
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border">
        <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">
          Noch keine Dokumente mit dir geteilt
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map(share => (
        <div
          key={share.id}
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {share.document?.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Von: <span className="font-medium">{share.document?.created_by}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Geteilt am: {new Date(share.shared_at).toLocaleDateString('de-DE')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${ACCESS_COLORS[share.access_level]}`}>
                {ACCESS_LABELS[share.access_level]}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {share.access_level !== 'view' && (
              <Button
                onClick={() => handleDownload(share.document)}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Herunterladen
              </Button>
            )}
            <Button
              onClick={() => handleRevoke(share.id)}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Widerrufen
            </Button>
          </div>

          {share.expires_at && (
            <p className="text-xs text-amber-600 mt-2">
              ⏰ Läuft ab: {new Date(share.expires_at).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}