import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentUploadForm from '../components/documents/DocumentUploadForm';
import DocumentSearchAndView from '../components/documents/DocumentSearchAndView';
import DocumentComparisonViewer from '../components/documents/DocumentComparisonViewer';
import { Upload, Search, GitCompare } from 'lucide-react';

export default function DocumentOCRUpload() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadDocuments();
  }, [refreshKey]);

  async function loadDocuments() {
    try {
      const user = await base44.auth.me();
      const docs = await base44.entities.OCRDocument.filter(
        { user_email: user.email },
        '-created_date',
        1000
      );
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  function handleUploadComplete() {
    setRefreshKey(prev => prev + 1);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">📄 Intelligente Dokumentenverwaltung</h1>
        <p className="text-muted-foreground">
          AI-gestützte OCR, Sentiment-Analyse, Datenextraktion und Dokumentenvergleich
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Hochladen
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Suchen
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Vergleichen
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4 mt-6">
          <DocumentUploadForm onUploadComplete={handleUploadComplete} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">✅ Automatische OCR</p>
              <p className="text-sm text-blue-800">Text wird automatisch extrahiert und analysiert</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-900 mb-1">🔍 Suchbar</p>
              <p className="text-sm text-green-800">Alle Inhalte sind sofort durchsuchbar</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-semibold text-purple-900 mb-1">🏷️ Kategorisiert</p>
              <p className="text-sm text-purple-800">Mit Schlüsselwörtern und Zusammenfassungen</p>
            </div>
          </div>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="mt-6">
          <DocumentSearchAndView key={refreshKey} />
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="compare" className="mt-6">
          {documents.length < 2 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Laden Sie mindestens 2 Dokumente hoch, um sie zu vergleichen</p>
            </div>
          ) : (
            <DocumentComparisonViewer documents={documents} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}