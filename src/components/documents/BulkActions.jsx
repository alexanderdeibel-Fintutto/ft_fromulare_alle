// components/documents/BulkActions.jsx
import React from 'react';
import { Trash2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BulkActions({ selectedCount, onClear, onDelete, onDownload }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 z-50">
      <span className="font-medium">{selectedCount} ausgewählt</span>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="text-white hover:bg-gray-800"
        >
          <Download className="w-4 h-4 mr-2" />
          Herunterladen
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-400 hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Löschen
        </Button>
        
        <div className="w-px h-6 bg-gray-700 mx-2" />
        
        <button
          onClick={onClear}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}