import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Download, ExternalLink, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DocumentSearchAndView() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadDocuments();
  }, []);

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
      toast.error('Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  }

  function filterAndSortDocuments() {
    let filtered = documents;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.file_name?.toLowerCase().includes(query) ||
        doc.extracted_text?.toLowerCase().includes(query) ||
        doc.keywords?.some(k => k.toLowerCase().includes(query)) ||
        doc.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_category === categoryFilter);
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.file_name.localeCompare(b.file_name));
    }

    return filtered;
  }

  async function deleteDocument(docId) {
    if (!confirm('Dokument wirklich löschen?')) return;

    try {
      await base44.entities.OCRDocument.delete(docId);
      setDocuments(documents.filter(d => d.id !== docId));
      setSelectedDoc(null);
      toast.success('Dokument gelöscht');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    }
  }

  const filteredDocs = filterAndSortDocuments();
  const categoryLabels = {
    contract: '📋 Vertrag',
    invoice: '💰 Rechnung',
    receipt: '🧾 Beleg',
    letter: '📧 Brief',
    form: '📝 Formular',
    other: '📄 Sonstiges'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Search & Filters */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Suchen & Filtern</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Text, Tags, Dateiname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium block mb-1">Dokumenttyp</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="contract">Verträge</SelectItem>
                  <SelectItem value="invoice">Rechnungen</SelectItem>
                  <SelectItem value="receipt">Belege</SelectItem>
                  <SelectItem value="letter">Briefe</SelectItem>
                  <SelectItem value="form">Formulare</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-medium block mb-1">Sortieren</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Neueste zuerst</SelectItem>
                  <SelectItem value="oldest">Älteste zuerst</SelectItem>
                  <SelectItem value="name">Nach Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground pt-2">
              {filteredDocs.length} Dokument{filteredDocs.length !== 1 ? 'e' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Document List */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {loading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filteredDocs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine Dokumente gefunden</p>
          ) : (
            filteredDocs.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full text-left p-2 rounded border transition-colors ${
                  selectedDoc?.id === doc.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex gap-2 items-start min-w-0">
                  <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_date), 'dd.MM.yyyy')}
                    </p>
                  </div>
                  {doc.processing_status === 'completed' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Document Details */}
      <div className="lg:col-span-2">
        {selectedDoc ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {selectedDoc.file_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Hochgeladen: {format(new Date(selectedDoc.created_date), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
                <Badge variant={selectedDoc.processing_status === 'completed' ? 'secondary' : 'outline'}>
                  {selectedDoc.processing_status === 'completed' ? '✓ Verarbeitet' : '⏳ ' + selectedDoc.processing_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Dokumenttyp</p>
                  <p className="text-sm font-medium">{categoryLabels[selectedDoc.document_category]}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Dateigröße</p>
                  <p className="text-sm font-medium">{selectedDoc.file_size_kb}KB</p>
                </div>
              </div>

              {/* Keywords */}
              {selectedDoc.keywords && selectedDoc.keywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Schlüsselwörter</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDoc.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-blue-50"
                        onClick={() => setSearchQuery(kw)}>
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedDoc.summary && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Zusammenfassung</p>
                  <p className="text-sm p-3 bg-blue-50 rounded border border-blue-200">
                    {selectedDoc.summary}
                  </p>
                </div>
              )}

              {/* Tags */}
              {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDoc.tags.map((tag, i) => (
                      <Badge key={i} className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDoc.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Notizen</p>
                  <p className="text-sm p-3 bg-gray-50 rounded">{selectedDoc.notes}</p>
                </div>
              )}

              {/* Sentiment Analysis */}
              {selectedDoc.sentiment_analysis && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Sentiment-Analyse</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Stimmung:</span>
                      <Badge className={
                        selectedDoc.sentiment_analysis.overall_sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        selectedDoc.sentiment_analysis.overall_sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {selectedDoc.sentiment_analysis.overall_sentiment === 'positive' ? '😊 Positiv' :
                         selectedDoc.sentiment_analysis.overall_sentiment === 'negative' ? '😞 Negativ' :
                         '😐 Neutral'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs">Score: {(selectedDoc.sentiment_analysis.sentiment_score * 100).toFixed(1)}%</p>
                    </div>
                    {selectedDoc.sentiment_analysis.emotion_tags && selectedDoc.sentiment_analysis.emotion_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedDoc.sentiment_analysis.emotion_tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Structured Data */}
              {selectedDoc.structured_data && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">💰 Strukturierte Daten</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedDoc.structured_data.invoice_number && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground">Rechnungsnr.</p>
                        <p className="font-medium">{selectedDoc.structured_data.invoice_number}</p>
                      </div>
                    )}
                    {selectedDoc.structured_data.amount && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground">Betrag</p>
                        <p className="font-medium">{selectedDoc.structured_data.amount} {selectedDoc.structured_data.currency}</p>
                      </div>
                    )}
                    {selectedDoc.structured_data.date && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground">Datum</p>
                        <p className="font-medium">{selectedDoc.structured_data.date}</p>
                      </div>
                    )}
                    {selectedDoc.structured_data.due_date && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground">Fällig am</p>
                        <p className="font-medium">{selectedDoc.structured_data.due_date}</p>
                      </div>
                    )}
                    {selectedDoc.structured_data.sender && (
                      <div className="p-2 bg-gray-50 rounded col-span-2">
                        <p className="text-muted-foreground">Von</p>
                        <p className="font-medium">{selectedDoc.structured_data.sender}</p>
                      </div>
                    )}
                    {selectedDoc.structured_data.recipient && (
                      <div className="p-2 bg-gray-50 rounded col-span-2">
                        <p className="text-muted-foreground">An</p>
                        <p className="font-medium">{selectedDoc.structured_data.recipient}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Text Preview */}
              {selectedDoc.extracted_text && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Extrahierter Text (Vorschau)</p>
                  <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap">
                    {selectedDoc.extracted_text.substring(0, 500)}
                    {selectedDoc.extracted_text.length > 500 && '...'}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  size="sm"
                  onClick={() => window.open(selectedDoc.file_url, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Dokument öffnen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const element = document.createElement('a');
                    element.href = selectedDoc.file_url;
                    element.download = selectedDoc.file_name;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Herunterladen
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteDocument(selectedDoc.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Löschen
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">Wählen Sie ein Dokument aus, um die Details anzuzeigen</p>
          </Card>
        )}
      </div>
    </div>
  );
}