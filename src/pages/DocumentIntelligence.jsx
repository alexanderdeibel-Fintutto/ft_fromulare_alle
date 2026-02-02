import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Brain } from 'lucide-react';
import { toast } from 'sonner';
import AIFeatureToggle from '../components/ai/AIFeatureToggle';

export default function DocumentIntelligence() {
  const [loading, setLoading] = useState(false);
  const [docId, setDocId] = useState('');

  const handleProcess = async () => {
    if (!docId) {
      toast.error('Document ID erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('processDocumentIntelligence', {
        document_id: docId
      });
      setDocId('');
      toast.success('Verarbeitung gestartet');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AIFeatureToggle featureKey="ocr">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Document Intelligence</h1>

      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Brain className="w-8 h-8 text-indigo-600 mt-1" />
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 mb-2">OCR & Intelligente Verarbeitung</h2>
            <input
              type="text"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              placeholder="Document ID"
              className="w-full px-3 py-2 border rounded mb-3"
              disabled={loading}
            />
            <Button onClick={handleProcess} disabled={loading} className="gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Verarbeiten
            </Button>
          </div>
        </div>
      </Card>
      </div>
    </AIFeatureToggle>
  );
}