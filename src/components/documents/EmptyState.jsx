import React from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EmptyState() {
  return (
    <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Keine Dokumente vorhanden
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Du hast noch keine Dokumente erstellt. Erstelle jetzt eines basierend auf unseren Vorlagen.
      </p>
      <Link
        to={createPageUrl('FormulareIndex')}
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
      >
        Zur Vorlagenübersicht
      </Link>
    </div>
  );
}