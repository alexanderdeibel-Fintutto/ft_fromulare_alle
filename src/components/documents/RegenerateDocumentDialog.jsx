// components/documents/RegenerateDocumentDialog.jsx
import React, { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TemplateForm from '../templates/TemplateForm';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RegenerateDocumentDialog({ open, onClose, document, onSuccess }) {
  const [formData, setFormData] = useState(document?.input_data || {});
  const [generating, setGenerating] = useState(false);

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generatePDF', {
        templateId: document.template_id,
        templateSlug: document.document_type,
        formData,
        withWatermark: document.has_watermark,
        sourceApp: document.source_app,
        contextType: document.context_data?.context_type,
        contextId: document.context_data?.context_id,
        regenerate: true,
        originalDocumentId: document.id
      });

      if (response.data.success) {
        toast.success('Dokument neu generiert!');
        onSuccess(response.data.document);
        onClose();
      } else {
        toast.error(response.data.error || 'Fehler beim Generieren');
      }
    } catch (err) {
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dokument neu generieren</DialogTitle>
          <p className="text-sm text-gray-600">
            Bearbeite die Daten und erstelle eine neue Version
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Originaldokument:</strong> {document?.title}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Eine neue Version wird erstellt und das Original bleibt erhalten
            </p>
          </div>

          {document?.template && (
            <TemplateForm
              schema={document.template.json_schema || document.template.schema}
              initialData={formData}
              onChange={setFormData}
            />
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleRegenerate} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird generiert...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Neu generieren
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}