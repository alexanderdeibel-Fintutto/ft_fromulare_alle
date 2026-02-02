import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppHeader from '../components/layout/AppHeader';
import { Loader } from 'lucide-react';

const FORMAT_ICONS = {
  json: '📄',
  csv: '📊',
  pdf: '📕',
  xlsx: '📗'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

export default function ExportHistory() {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExports();
  }, []);

  const loadExports = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const exportHistory = await base44.entities.ExportHistory.filter(
        { user_email: user.email },
        '-created_date'
      );
      setExports(exportHistory || []);
    } catch (err) {
      console.error('Load exports failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (exportItem) => {
    if (exportItem.file_url) {
      window.open(exportItem.file_url, '_blank');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Export-Verlauf</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : exports.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Noch keine Exporte</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Export-Typ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Datensätze
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Größe
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exports.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {exp.export_type.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{FORMAT_ICONS[exp.format]}</span>
                        {exp.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {exp.record_count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatFileSize(exp.file_size_bytes)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(exp.created_date).toLocaleDateString('de-DE')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[exp.status]}`}>
                        {exp.status === 'completed' ? 'Fertig' : exp.status === 'pending' ? 'Läuft' : 'Fehler'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {exp.status === 'completed' && (
                        <Button
                          onClick={() => handleDownload(exp)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}