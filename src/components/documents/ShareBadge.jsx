import React from 'react';
import { Share2 } from 'lucide-react';

export default function ShareBadge({ sharedCount, sharedWithApps }) {
  if (sharedCount === 0) return null;

  return (
    <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-md">
      <Share2 className="w-3 h-3" />
      <span>{sharedCount}</span>
      {sharedWithApps && sharedWithApps.length > 0 && (
        <span className="text-xs opacity-90">
          · {sharedWithApps.join(', ')}
        </span>
      )}
    </div>
  );
}