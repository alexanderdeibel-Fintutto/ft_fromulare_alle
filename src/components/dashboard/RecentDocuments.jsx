// components/dashboard/RecentDocuments.jsx
import React from 'react';
import { FileText, Download, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export default function RecentDocuments({ documents = [] }) {
  const navigate = useNavigate();
  
  const recentDocs = documents.slice(0, 5);

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-2">Noch keine Dokumente</h3>
        <p className="text-gray-600 text-sm mb-4">
          Erstelle dein erstes Dokument aus einer unserer Vorlagen.
        </p>
        <Button onClick={() => navigate(createPageUrl('FormulareIndex'))}>
          Vorlage auswählen
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Letzte Dokumente</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(createPageUrl('MeineDokumente'))}
        >
          Alle anzeigen
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="divide-y">
        {recentDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => window.open(doc.file_url, '_blank')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {doc.title || doc.file_name}
                </h4>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(doc.created_date), 'dd. MMM yyyy', { locale: de })}
                  </span>
                  {doc.template?.name && (
                    <span className="text-gray-400">•</span>
                  )}
                  {doc.template?.name && (
                    <span>{doc.template.name}</span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(doc.file_url, '_blank');
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}