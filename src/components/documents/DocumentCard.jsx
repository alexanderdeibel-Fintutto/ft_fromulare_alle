import React, { useState, useEffect } from 'react';
import { Star, Download, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocumentSyncButton from './DocumentSyncButton';
import CrossAppIndicator from './CrossAppIndicator';
import DocumentShareDialog from './DocumentShareDialog';
import ShareBadge from './ShareBadge';
import { useDocumentShares } from '../hooks/useDocumentShares';

export default function DocumentCard({ document, onToggleFavorite, onDelete }) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { shareCount, sharedWithApps } = useDocumentShares(document.id);

  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  return (
    <div className="relative bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      {shareCount > 0 && (
        <ShareBadge sharedCount={shareCount} sharedWithApps={sharedWithApps} />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-sm">
            {document.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(document.created_date)}
          </p>
        </div>
        <button
          onClick={() => onToggleFavorite(document.id)}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        >
          <Star
            className={`w-4 h-4 ${
              document.is_favorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      <CrossAppIndicator 
        sourceApp={document.source_app} 
        sharedWithApps={document.shared_with_apps} 
      />

      {document.has_watermark && (
        <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded mb-3 inline-block">
          Mit Wasserzeichen
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8"
        >
          <Download className="w-3 h-3 mr-1" />
          Herunterladen
        </Button>
        <Button
          onClick={() => setShowShareDialog(true)}
          size="sm"
          variant="outline"
          className="text-xs h-8"
        >
          <Share2 className="w-3 h-3" />
        </Button>
        <DocumentSyncButton document={document} />
        <button
          onClick={() => onDelete(document.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <DocumentShareDialog
            documentId={document.id}
            documentTitle={document.title}
            documentUrl={document.file_url}
            sourceApp="ft-formulare"
            onClose={() => setShowShareDialog(false)}
            onSuccess={() => setShowShareDialog(false)}
          />
        </div>
      )}
    </div>
  );
}