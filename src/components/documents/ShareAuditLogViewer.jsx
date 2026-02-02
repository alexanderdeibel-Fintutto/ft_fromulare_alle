import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareAuditLogViewer({ shareId, documentId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    has_more: false
  });

  useEffect(() => {
    loadLogs();
  }, [shareId, documentId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let response;
      if (shareId) {
        response = await base44.functions.invoke('getShareAuditLog', {
          share_id: shareId,
          limit: pagination.limit,
          offset: pagination.offset
        });
      } else if (documentId) {
        response = await base44.functions.invoke('getShareAuditLog', {
          document_id: documentId,
          limit: pagination.limit,
          offset: pagination.offset
        });
      }

      setLogs(response.data.logs || []);
      setPagination({
        limit: response.data.limit,
        offset: response.data.offset,
        has_more: response.data.has_more
      });
    } catch (err) {
      setError(err.message);
      toast.error('Audit Log konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      'share.created': '✓ Freigegeben',
      'share.revoked': '✗ Widerrufen',
      'share.updated': '↻ Aktualisiert',
      'share.downloaded': '↓ Heruntergeladen'
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-900">Fehler</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Keine Audit-Logs vorhanden
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {getActionLabel(log.action)}
                </p>
                <p className="text-sm text-gray-600">
                  von {log.actor_email}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss')}
              </span>
            </div>
            {log.changes && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                <pre className="overflow-auto">{JSON.stringify(log.changes, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {pagination.has_more && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
              loadLogs();
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mehr laden
          </button>
        </div>
      )}
    </div>
  );
}