import React from 'react';
import { Info } from 'lucide-react';

const APP_NAMES = {
  mieterapp: 'MieterApp',
  vermietify: 'Vermietify',
  fintutto: 'FinTuttO'
};

export default function ContextBanner({ sourceApp, message }) {
  if (!sourceApp) return null;

  const appName = APP_NAMES[sourceApp] || sourceApp;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-6">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-800">
        {message || `Daten aus ${appName} vorgefüllt`}
      </p>
    </div>
  );
}