import React from 'react';
import { CheckCircle, Download, Star, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function DocumentSuccessDialog({ 
  open, 
  onClose, 
  document, 
  onDownload, 
  onViewDocuments 
}) {
  if (!document) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">
            Dokument erfolgreich erstellt!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-1">{document.template_name}</p>
            <p>Dein Dokument wurde erfolgreich generiert und gespeichert.</p>
          </div>
          
          {document.has_watermark && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              ℹ️ Dieses Dokument enthält ein Wasserzeichen. Upgrade für die volle Version.
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={onDownload}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Jetzt herunterladen
            </Button>
            
            <Button 
              onClick={onViewDocuments}
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              Alle Dokumente ansehen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}