import React, { useState, useEffect } from 'react';
import { Zap, TrendingDown, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';

export default function CreditsActivityLog({ pack5Purchase }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pack5Purchase?.id) {
      setLoading(false);
      return;
    }

    async function loadLogs() {
      try {
        const data = await base44.entities.CreditsUsageLog.filter(
          { pack5_purchase_id: pack5Purchase.id },
          '-created_date',
          50
        );
        setLogs(data);
      } catch (err) {
        console.error('Error loading credits log:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [pack5Purchase?.id]);

  if (!pack5Purchase || pack5Purchase.package_type !== 'pack_5') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border text-center">
        <p className="text-gray-600">Lädt...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border text-center">
        <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-2">Keine Nutzung</h3>
        <p className="text-gray-600 text-sm">
          Credits werden hier angezeigt, wenn du Vorlagen verwendest.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-purple-600" />
          Credits-Nutzung
        </h3>
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {log.template_name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      {log.action_type === 'download' && 'Heruntergeladen'}
                      {log.action_type === 'preview' && 'Vorschau'}
                      {log.action_type === 'generation' && 'Generiert'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(log.created_date), 'dd. MMM, HH:mm', { locale: de })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-sm font-semibold text-gray-900">
                  -{log.credits_consumed} Credit
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {log.credits_remaining} übrig
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="p-4 bg-gray-50 border-t text-xs text-gray-600">
          Zeigt die letzten 50 Transaktionen
        </div>
      )}
    </div>
  );
}