import React from 'react';
import { CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SyncTable({ documents }) {
  const getSyncIcon = (status) => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncBadgeColor = (status) => {
    switch (status) {
      case 'synced':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">Dokument</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Nutzer</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Quell-App</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Geteilt mit</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Zuletzt aktualisiert</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {documents?.map(doc => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-sm font-medium">
                <div className="truncate max-w-xs" title={doc.title}>
                  {doc.title}
                </div>
              </td>
              <td className="px-6 py-3 text-sm text-gray-600 truncate">
                {doc.user_email}
              </td>
              <td className="px-6 py-3 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {doc.source_app || 'ft_formulare'}
                </span>
              </td>
              <td className="px-6 py-3 text-sm">
                {doc.shared_with_apps?.length > 0 ? (
                  <div className="flex gap-1 flex-wrap">
                    {doc.shared_with_apps.map(app => (
                      <span key={app} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        {app}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  {getSyncIcon(doc.sync_status)}
                  <span className={`text-xs px-2 py-1 rounded ${getSyncBadgeColor(doc.sync_status)}`}>
                    {doc.sync_status}
                  </span>
                </div>
              </td>
              <td className="px-6 py-3 text-sm text-gray-600">
                {doc.synced_at
                  ? formatDistanceToNow(new Date(doc.synced_at), { addSuffix: true, locale: de })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}