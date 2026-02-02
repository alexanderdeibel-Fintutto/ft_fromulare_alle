import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AICostDisplay({ usage }) {
  if (!usage) return null;

  const { cost_eur, savings_eur, savings_percent } = usage;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 pt-2 border-t">
      <span>Diese Antwort: €{cost_eur?.toFixed(4) || '0.0000'}</span>
      {savings_eur > 0 && (
        <span className="flex items-center gap-1 text-green-600">
          <Sparkles className="w-3 h-3" />
          €{savings_eur.toFixed(4)} gespart ({savings_percent}%)
        </span>
      )}
    </div>
  );
}