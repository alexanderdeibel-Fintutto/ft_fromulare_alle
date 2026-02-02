import React from 'react';
import { Globe } from 'lucide-react';

const APP_NAMES = {
  'ft-formulare': 'FT',
  'vermietify': 'VM',
  'mieterapp': 'MA',
  'hausmeisterpro': 'HP',
  'nk-rechner': 'NK'
};

const APP_COLORS = {
  'ft-formulare': 'bg-blue-100 text-blue-700',
  'vermietify': 'bg-green-100 text-green-700',
  'mieterapp': 'bg-purple-100 text-purple-700',
  'hausmeisterpro': 'bg-orange-100 text-orange-700',
  'nk-rechner': 'bg-red-100 text-red-700'
};

export default function CrossAppIndicator({ sourceApp, sharedWithApps }) {
  if (!sourceApp && (!sharedWithApps || sharedWithApps.length === 0)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      {sourceApp && (
        <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
          <Globe className="w-3 h-3" />
          {APP_NAMES[sourceApp] || sourceApp}
        </div>
      )}
      
      {sharedWithApps && sharedWithApps.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">→</span>
          {sharedWithApps.map(app => (
            <div
              key={app}
              className={`px-2 py-1 rounded text-xs font-medium ${APP_COLORS[app] || 'bg-gray-100 text-gray-700'}`}
              title={app}
            >
              {APP_NAMES[app] || app}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}