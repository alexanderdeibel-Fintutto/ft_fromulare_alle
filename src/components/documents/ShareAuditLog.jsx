import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ShareAuditLog({ documentId }) {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAuditLog();
  }, [documentId]);

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getShareAuditLog', {
        document_id: documentId
      });

      if (response.data?.logs) {
        setAuditLog(response.data.logs);
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Wird geladen...</div>;
  }

  if (auditLog.length === 0) {
    return <div className="text-sm text-gray-500">Keine Einträge</div>;
  }

  return (
    <div className="space-y-2">
      {auditLog.map((entry, idx) => (
        <div key={idx} className="flex items-start gap-3 text-sm pb-2 border-b last:border-b-0">
          <div className="flex-shrink-0 mt-1">
            {entry.action === 'shared' && (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            )}
            {entry.action === 'revoked' && (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            {!['shared', 'revoked'].includes(entry.action) && (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {entry.action === 'shared' ? 'Geteilt mit' : 
                 entry.action === 'revoked' ? 'Widerrufen' : 
                 'Geändert'}
              </span>
              <span className="text-gray-600">{entry.email}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(entry.timestamp).toLocaleString('de-DE')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}