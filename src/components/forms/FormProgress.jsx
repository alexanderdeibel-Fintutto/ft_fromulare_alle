import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function FormProgress({ progress }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Formular ausfüllen</label>
        <span className="text-sm font-medium text-blue-600">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress === 100 && (
        <div className="flex items-center gap-2 text-sm text-green-600 pt-1">
          <CheckCircle className="w-4 h-4" />
          Formular vollständig
        </div>
      )}
    </div>
  );
}