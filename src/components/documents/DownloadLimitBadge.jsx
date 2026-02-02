import React from 'react';
import { Download } from 'lucide-react';

export default function DownloadLimitBadge({ currentDownloads, maxDownloads }) {
  if (!maxDownloads) return null;

  const remaining = maxDownloads - currentDownloads;
  const isWarning = remaining <= 2;
  const isExceeded = remaining <= 0;

  return (
    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
      isExceeded ? 'bg-red-100 text-red-700' :
      isWarning ? 'bg-amber-100 text-amber-700' :
      'bg-blue-100 text-blue-700'
    }`}>
      <Download className="w-3 h-3" />
      {isExceeded ? (
        <span>Limit erreicht</span>
      ) : (
        <span>{remaining} von {maxDownloads} Downloads</span>
      )}
    </div>
  );
}