import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Calendar, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';

export default function DocumentSearch() {
  const [query, setQuery] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const response = await base44.functions.invoke('searchDocuments', {
        query: query,
        documentType: documentType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 50
      });

      if (response.data?.success) {
        setResults(response.data.results || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (document) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dokumentensuche</h1>

        {/* Search Form */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suchbegriff
              </label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Titel, Beschreibung..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dokumenttyp
              </label>
              <Input
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="z.B. kuendigung"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Von Datum
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bis Datum
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading}
            className="mt-6 w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Search className="w-4 h-4" />
            Suchen
          </Button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : searched ? (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {results.length} Dokument(e) gefunden
              </p>
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-lg border p-8 text-center">
                <p className="text-gray-600">Keine Dokumente gefunden</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {doc.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Typ: {doc.document_type}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(doc.created_date).toLocaleDateString('de-DE')}
                          </span>
                          {doc.has_watermark && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              Wasserzeichen
                            </span>
                          )}
                          {doc.is_favorite && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Favorit
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(doc)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Verwenden Sie die Suche oben, um Dokumente zu finden</p>
          </div>
        )}
      </main>
    </div>
  );
}