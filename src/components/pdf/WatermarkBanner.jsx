import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function WatermarkBanner() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 mb-6">
      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-yellow-900">
          Entwurf mit Wasserzeichen
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          Dieses Dokument wird mit einem Wasserzeichen erstellt, bis du die Vorlage kaufst.
        </p>
      </div>
    </div>
  );
}