import React, { useState, useMemo, useEffect } from 'react';
import { useSharedDocumentsCrossApp } from '@/components/hooks/useSharedDocumentsCrossApp';
import { Download, RotateCcw, Share2, Loader, FileText, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SharedDocumentsFilter from './SharedDocumentsFilter';
import SharedDocumentsPaginated from './SharedDocumentsPaginated';
import DownloadLimitBadge from './DownloadLimitBadge';
import { base44 } from '@/api/base44Client';

const APP_NAMES = {
  'ft-formulare': 'FT Formulare',
  'vermietify': 'Vermietify',
  'mieterapp': 'MieterApp',
  'hausmeisterpro': 'HausmeisterPro',
  'nk-rechner': 'NK-Rechner'
};

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

export default function SharedDocumentsCrossApp() {
  const { documents, groupedByApp, loading, revokeShare, refetch } = useSharedDocumentsCrossApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [appFilter, setAppFilter] = useState('');
  const [accessLevelFilter, setAccessLevelFilter] = useState('');
  const [availableApps, setAvailableApps] = useState([]);
  const [selectedShares, setSelectedShares] = useState(new Set());

  useEffect(() => {
    const apps = Object.keys(groupedByApp || {});
    setAvailableApps(apps);
  }, [groupedByApp]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetch?.();
    }, 30000); // Refresh alle 30 Sekunden
    return () => clearInterval(interval);
  }, [refetch]);

  const filteredDocuments = useMemo(() => {
    let result = documents || [];

    if (searchTerm) {
      result = result.filter(doc =>
        doc.document_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (appFilter) {
      result = result.filter(doc => doc.source_app === appFilter);
    }

    if (accessLevelFilter) {
      result = result.filter(doc => doc.access_level === accessLevelFilter);
    }

    return result;
  }, [documents, searchTerm, appFilter, accessLevelFilter]);

  const filteredGroupedByApp = useMemo(() => {
    const grouped = {};
    filteredDocuments.forEach(doc => {
      if (!grouped[doc.source_app]) {
        grouped[doc.source_app] = [];
      }
      grouped[doc.source_app].push(doc);
    });
    return grouped;
  }, [filteredDocuments]);

  const handleDownload = async (share) => {
    if (share.document_url) {
      // Track download
      await base44.functions.invoke('trackShareDownload', {
        share_id: share.id,
        document_id: share.document_id
      }).catch(err => console.log('Track failed:', err));
      
      window.open(share.document_url, '_blank');
    }
  };

  const handleRevoke = async (shareId) => {
    try {
      await revokeShare(shareId);
      toast.success('Freigabe widerrufen');
      refetch?.();
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    }
  };

  const handleBatchRevoke = async () => {
    if (!window.confirm(`${selectedShares.size} Freigaben wirklich widerrufen?`)) return;
    
    try {
      await base44.functions.invoke('batchRevokeShares', {
        share_ids: Array.from(selectedShares)
      });
      toast.success(`${selectedShares.size} Freigaben widerrufen`);
      setSelectedShares(new Set());
      refetch?.();
    } catch (err) {
      toast.error('Fehler beim Widerrufen');
    }
  };

  const toggleShareSelect = (shareId, checked) => {
    const newSet = new Set(selectedShares);
    if (checked) {
      newSet.add(shareId);
    } else {
      newSet.delete(shareId);
    }
    setSelectedShares(newSet);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-gray-600">Dokumente werden geladen...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <Share2 className="w-14 h-14 text-blue-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Noch keine geteilten Dokumente
        </h3>
        <p className="text-gray-600 text-sm">
          Dokumente, die andere Apps mit dir teilen, erscheinen hier
        </p>
      </div>
    );
  }

  return (
    <div>
      <SharedDocumentsFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        appFilter={appFilter}
        onAppFilterChange={setAppFilter}
        accessLevelFilter={accessLevelFilter}
        onAccessLevelChange={setAccessLevelFilter}
        availableApps={availableApps}
      />

      {/* Batch Actions */}
      {selectedShares.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-blue-900">
            {selectedShares.size} Freigabe{selectedShares.size !== 1 ? 'n' : ''} ausgewählt
          </p>
          <div className="flex gap-2">
            <Button onClick={handleBatchRevoke} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Alle widerrufen
            </Button>
            <Button onClick={() => setSelectedShares(new Set())} variant="outline" size="sm">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border">
          <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Keine Dokumente mit diesen Filtern gefunden</p>
        </div>
      ) : (
        <SharedDocumentsPaginated
          documents={filteredDocuments}
          renderDocument={(share) => (
            <div key={share.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedShares.has(share.id)}
                  onChange={(e) => toggleShareSelect(share.id, e.target.checked)}
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-medium ${share.expires_at && new Date(share.expires_at) < new Date() ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {share.document_title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ACCESS_COLORS[share.access_level]}`}>
                      {ACCESS_LABELS[share.access_level]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    Von <strong>{share.shared_by_email}</strong> • {new Date(share.shared_at).toLocaleDateString('de-DE')}
                  </p>
                  {share.max_downloads && (
                    <DownloadLimitBadge 
                      currentDownloads={share.download_count || 0} 
                      maxDownloads={share.max_downloads} 
                    />
                  )}
                  <div className="flex gap-2 mt-3">
                    {share.access_level !== 'view' && (
                      <Button onClick={() => handleDownload(share)} size="sm" variant="outline" className="text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button onClick={() => handleRevoke(share.id)} size="sm" variant="outline" className="text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Widerrufen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}