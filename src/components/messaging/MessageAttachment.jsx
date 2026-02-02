import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image, FileText, ExternalLink } from 'lucide-react';

/**
 * Attachment Display in Messages
 * Zeigt Bilder, PDFs, und andere Dateien
 */
export default function MessageAttachment({ attachment }) {
  const isImage = attachment.file_type?.startsWith('image/');
  const isPDF = attachment.file_type === 'application/pdf';

  function handleDownload() {
    window.open(attachment.file_url, '_blank');
  }

  if (isImage) {
    return (
      <div className="mt-2 max-w-xs rounded-lg overflow-hidden border">
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleDownload}
        />
        <div className="p-2 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-600 truncate flex-1">
            {attachment.file_name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 px-2"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 border rounded-lg p-3 max-w-xs bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
          {isPDF ? (
            <FileText className="w-5 h-5 text-blue-600" />
          ) : (
            <FileText className="w-5 h-5 text-gray-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.file_name}
          </p>
          <p className="text-xs text-gray-500">
            {attachment.file_size
              ? `${(attachment.file_size / 1024).toFixed(1)} KB`
              : 'Datei'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="flex-shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}