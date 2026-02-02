import React from 'react';
import { Lock, Globe, CheckCircle, Zap } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    {
      icon: Lock,
      title: 'SSL verschlüsselt',
      subtitle: 'Sichere Datenübertragung'
    },
    {
      icon: Globe,
      title: 'Made in Germany',
      subtitle: 'DSGVO-konform'
    },
    {
      icon: CheckCircle,
      title: '100% Kostenlos',
      subtitle: 'Keine versteckten Kosten'
    },
    {
      icon: Zap,
      title: 'Sofort-Ergebnis',
      subtitle: 'In 30 Sekunden'
    }
  ];

  return (
    <div className="bg-slate-50 border-t border-b border-gray-200 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div key={idx} className="flex items-center gap-3">
                <Icon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{badge.title}</div>
                  <div className="text-xs text-gray-600">{badge.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}