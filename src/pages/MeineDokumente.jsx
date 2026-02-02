import React, { useState, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { useUserDocuments } from '../components/hooks/useUserDocuments';
import { base44 } from '@/api/base44Client';
import AppHeader from '../components/layout/AppHeader';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentFilter from '../components/documents/DocumentFilter';
import EmptyState from '../components/documents/EmptyState';
import BulkActionsToolbar from '../components/documents/BulkActionsToolbar';
import SharedDocumentsCrossApp from '../components/documents/SharedDocumentsCrossApp';
import { Download, Loader, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MeineDokumente() {
  const { documents, loading, toggleFavorite, removeDocument } = useUserDocuments();
  const [sortBy, setSortBy] = useState('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my-documents');

  const filtered = useMemo(() => {
    let result = documents;

    if (showFavoritesOnly) {
      result = result.filter(d => d.is_favorite);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result = [...result].sort((a, b) =>
          new Date(b.created_date) - new Date(a.created_date)
        );
        break;
      case 'oldest':
        result = [...result].sort((a, b) =>
          new Date(a.created_date) - new Date(b.created_date)
        );
        break;
      case 'name':
        result = [...result].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        break;
      default:
        break;
    }

    return result;
  }, [documents, sortBy, showFavoritesOnly]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDocs(new Set(filtered.map(d => d.id)));
    } else {
      setSelectedDocs(new Set());
    }
  };

  const handleSelectDoc = (docId, checked) => {
    const newSet = new Set(selectedDocs);
    if (checked) {
      newSet.add(docId);
    } else {
      newSet.delete(docId);
    }
    setSelectedDocs(newSet);
  };

  const handleBulkExport = async () => {
    setBulkLoading(true);
    try {
      const response = await base44.functions.invoke('batchExportDocuments', {
        documentIds: Array.from(selectedDocs),
        format: 'json'
      });

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documents_export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Dokumente exportiert');
      setSelectedDocs(new Set());
    } catch (err) {
      toast.error('Export fehlgeschlagen');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`${selectedDocs.size} Dokument(e) wirklich löschen?`)) return;

    setBulkLoading(true);
    try {
      await base44.functions.invoke('batchDeleteDocuments', {
        documentIds: Array.from(selectedDocs),
        softDelete: true
      });

      toast.success('Dokumente gelöscht');
      setSelectedDocs(new Set());
      window.location.reload();
    } catch (err) {
      toast.error('Löschen fehlgeschlagen');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading && activeTab === 'my-documents') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (activeTab === 'my-documents' && documents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <EmptyState />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Dokumente
            </h1>
            <p className="text-gray-600">
              {activeTab === 'my-documents' 
                ? `${documents.length} ${documents.length === 1 ? 'Dokument' : 'Dokumente'}`
                : 'Mit dir geteilte Dokumente'
              }
            </p>
          </div>

          <a
            href={createPageUrl('FormulareIndex')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Neues Dokument erstellen
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('my-documents')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              activeTab === 'my-documents'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📄 Meine Dokumente
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-4 py-2 rounded font-medium transition-all flex items-center gap-2 ${
              activeTab === 'shared'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Mit mir geteilt
          </button>
        </div>

        {/* Meine Dokumente Tab */}
        {activeTab === 'my-documents' && (
          <>
            {/* Bulk Actions */}
            <BulkActionsToolbar
              selectedCount={selectedDocs.size}
              onExport={handleBulkExport}
              onDelete={handleBulkDelete}
              loading={bulkLoading}
            />

            {/* Filter */}
            <div className="flex justify-between items-center mb-6">
              <DocumentFilter
                sortBy={sortBy}
                onSortChange={setSortBy}
                showFavoritesOnly={showFavoritesOnly}
                onShowFavoritesOnlyChange={setShowFavoritesOnly}
                documentCount={filtered.length}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedDocs.size === filtered.length && filtered.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                Alle auswählen
              </label>
            </div>

            {/* Document Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(doc => (
                <div key={doc.id} className="relative">
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={(e) => handleSelectDoc(doc.id, e.target.checked)}
                    className="absolute top-2 left-2 z-10 w-5 h-5 cursor-pointer"
                  />
                  <DocumentCard
                    document={doc}
                    onToggleFavorite={toggleFavorite}
                    onDelete={removeDocument}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Shared Documents Tab */}
        {activeTab === 'shared' && (
          <SharedDocumentsCrossApp />
        )}
      </main>
    </div>
  );
}