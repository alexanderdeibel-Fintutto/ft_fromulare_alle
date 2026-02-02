import React from 'react';
import { Loader, Eye } from 'lucide-react';

export default function PdfPreview({ loading, previewUrl }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600 text-sm">PDF wird generiert...</p>
        </div>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="bg-white rounded-lg p-8 flex justify-center items-center h-96">
        <div className="text-center">
          <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Vorschau wird angezeigt, sobald du das Formular ausfüllst</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden border">
      <iframe
        src={previewUrl}
        className="w-full h-96"
        title="PDF Preview"
      />
    </div>
  );
}