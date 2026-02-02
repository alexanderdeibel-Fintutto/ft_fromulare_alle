// components/packages/UserCreditsDisplay.jsx
import React from 'react';
import { Zap, Package } from 'lucide-react';
import { useUserCredits } from '../hooks/useUserCredits';

export default function UserCreditsDisplay() {
  const { hasPackAll, pack5Credits, loading } = useUserCredits();

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-300 animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded" />
        <div className="w-20 h-3 bg-gray-300 rounded" />
      </div>
    );
  }

  if (hasPackAll) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 rounded-full border border-green-300">
        <Zap className="w-4 h-4 text-green-700" />
        <span className="text-sm font-medium text-green-900">
          Alle Vorlagen
        </span>
      </div>
    );
  }

  if (pack5Credits > 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full border border-purple-300">
        <Package className="w-4 h-4 text-purple-700" />
        <span className="text-sm font-medium text-purple-900">
          {pack5Credits} {pack5Credits === 1 ? 'Credit' : 'Credits'}
        </span>
      </div>
    );
  }

  return null;
}