import React, { useState, useEffect } from 'react';
import { Download, Calendar, FileText, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';

export default function DownloadHistory({ user }) {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_downloads: 0,
    unique_templates: 0,
    this_month: 0
  });

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    async function loadDownloads() {
      try {
        const data = await base44.entities.DocumentDownload.filter(
          { user_email: user.email },
          '-created_date',
          100
        );
        setDownloads(data);

        // Berechne Stats
        const uniqueTemplates = new Set(data.map(d => d.template_id)).size;
        const thisMonth = data.filter(d => {
          const date = new Date(d.created_date);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;

        setStats({
          total_downloads: data.length,
          unique_templates: uniqueTemplates,
          this_month: thisMonth
        });
      } catch (err) {
        console.error('Error loading downloads:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDownloads();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border text-center">
        <p className="text-gray-600">Lädt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_downloads}</p>
            </div>
            <Download className="w-8 h-8 text-blue-100" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unterschiedliche</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unique_templates}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-100" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Diesen Monat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.this_month}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-100" />
          </div>
        </div>
      </div>

      {/* History */}
      {downloads.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border text-center">
          <Download className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Keine Downloads</h3>
          <p className="text-gray-600 text-sm">
            Deine Download-Historie wird hier angezeigt.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Download-Historie</h3>
          </div>

          <div className="divide-y max-h-96 overflow-y-auto">
            {downloads.map((download) => (
              <div key={download.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {download.template_name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {download.download_format.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(download.created_date), 'dd. MMM HH:mm', { locale: de })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-500 flex-shrink-0">
                    {download.file_size_bytes ? (
                      `${(download.file_size_bytes / 1024 / 1024).toFixed(1)} MB`
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {downloads.length > 0 && (
            <div className="p-4 bg-gray-50 border-t text-xs text-gray-600">
              Zeigt die letzten 100 Downloads
            </div>
          )}
        </div>
      )}
    </div>
  );
}