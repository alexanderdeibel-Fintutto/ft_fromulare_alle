import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, FileText, Download, Share2, Calendar } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import { Loader } from 'lucide-react';

const ACTIVITY_ICONS = {
  document_created: <FileText className="w-5 h-5 text-green-600" />,
  document_updated: <FileText className="w-5 h-5 text-blue-600" />,
  document_deleted: <FileText className="w-5 h-5 text-red-600" />,
  document_downloaded: <Download className="w-5 h-5 text-purple-600" />,
  document_shared: <Share2 className="w-5 h-5 text-yellow-600" />,
  document_synced: <Activity className="w-5 h-5 text-teal-600" />
};

const ACTIVITY_LABELS = {
  document_created: 'Dokument erstellt',
  document_updated: 'Dokument aktualisiert',
  document_deleted: 'Dokument gelöscht',
  document_downloaded: 'Dokument heruntergeladen',
  document_shared: 'Dokument geteilt',
  document_synced: 'Dokument synchronisiert'
};

export default function UserActivityDashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('7'); // last 7 days

  useEffect(() => {
    loadActivities();
  }, [dateFilter]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const logs = await base44.entities.AuditLog.filter(
        { user_email: user.email },
        '-created_date',
        100
      );

      // Filter by date
      const days = parseInt(dateFilter);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const filtered = logs.filter(log => 
        new Date(log.created_date) >= cutoffDate
      );

      setActivities(filtered || []);
    } catch (err) {
      console.error('Load activities failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (activities) => {
    const grouped = {};
    activities.forEach(activity => {
      const date = new Date(activity.created_date).toLocaleDateString('de-DE');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });
    return grouped;
  };

  const groupedActivities = groupByDate(activities);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meine Aktivitäten</h1>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="7">Letzte 7 Tage</option>
            <option value="30">Letzte 30 Tage</option>
            <option value="90">Letzte 90 Tage</option>
            <option value="365">Letztes Jahr</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Keine Aktivitäten in diesem Zeitraum</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">{date}</h2>
                </div>
                <div className="space-y-2">
                  {dayActivities.map((activity, idx) => (
                    <div
                      key={`${activity.id}-${idx}`}
                      className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {ACTIVITY_ICONS[activity.action_type] || (
                            <Activity className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-medium text-gray-900">
                              {ACTIVITY_LABELS[activity.action_type] || activity.action_type}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.created_date).toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {activity.resource_name && (
                            <p className="text-sm text-gray-600">
                              {activity.resource_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              activity.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {activity.status === 'success' ? 'Erfolgreich' : 'Fehler'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {activity.resource_type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}