// components/billing/UsageStats.jsx
import React from 'react';
import { FileText, Download, Star, TrendingUp } from 'lucide-react';

export default function UsageStats({ documents = [] }) {
  const totalDocs = documents.length;
  const totalDownloads = documents.reduce((sum, doc) => sum + (doc.download_count || 0), 0);
  const favoriteCount = documents.filter(d => d.is_favorite).length;
  const thisMonthDocs = documents.filter(d => {
    const created = new Date(d.created_date);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    {
      icon: FileText,
      label: 'Erstellte Dokumente',
      value: totalDocs,
      color: 'blue'
    },
    {
      icon: TrendingUp,
      label: 'Diesen Monat',
      value: thisMonthDocs,
      color: 'green'
    },
    {
      icon: Star,
      label: 'Favoriten',
      value: favoriteCount,
      color: 'yellow'
    },
    {
      icon: Download,
      label: 'Downloads',
      value: totalDownloads || totalDocs,
      color: 'purple'
    }
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const colorClasses = {
          blue: 'bg-blue-100 text-blue-600',
          green: 'bg-green-100 text-green-600',
          yellow: 'bg-yellow-100 text-yellow-600',
          purple: 'bg-purple-100 text-purple-600'
        };

        return (
          <div key={idx} className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}