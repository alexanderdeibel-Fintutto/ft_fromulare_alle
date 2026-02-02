import React from 'react';
import { Activity, CheckCircle2, AlertCircle, Clock, Share2 } from 'lucide-react';

export default function SyncStats({ documents, purchases }) {
  const totalDocs = documents?.length || 0;
  const syncedDocs = documents?.filter(d => d.sync_status === 'synced').length || 0;
  const failedDocs = documents?.filter(d => d.sync_status === 'failed').length || 0;
  const pendingDocs = documents?.filter(d => d.sync_status === 'pending').length || 0;

  const sharedCount = documents?.filter(d => d.shared_with_apps?.length > 0).length || 0;
  const crossAppDocs = documents?.filter(d => d.source_app && d.source_app !== 'ft_formulare').length || 0;

  const stats = [
    {
      label: 'Gesamt Dokumente',
      value: totalDocs,
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      label: 'Synchronisiert',
      value: syncedDocs,
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      label: 'Fehlgeschlagen',
      value: failedDocs,
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      label: 'Ausstehend',
      value: pendingDocs,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      label: 'Geteilt mit Apps',
      value: sharedCount,
      icon: Share2,
      color: 'text-purple-600'
    },
    {
      label: 'Cross-App Dokumente',
      value: crossAppDocs,
      icon: Activity,
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <Icon className={`w-8 h-8 ${stat.color} opacity-20`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}