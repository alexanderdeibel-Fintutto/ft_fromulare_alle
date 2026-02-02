import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentComparisonViewer({ documents }) {
  const [selectedDocs, setSelectedDocs] = useState({ doc1: null, doc2: null });
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCompare() {
    if (!selectedDocs.doc1 || !selectedDocs.doc2) {
      toast.error('Bitte wählen Sie zwei Dokumente aus');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('compareDocuments', {
        documentId1: selectedDocs.doc1,
        documentId2: selectedDocs.doc2
      });

      setComparison(result.data.comparison);
      toast.success('Dokumente verglichen!');
    } catch (error) {
      console.error('Comparison error:', error);
      toast.error('Fehler beim Vergleich');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Dokumente vergleichen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Dokument 1</label>
              <Select value={selectedDocs.doc1 || ''} onValueChange={(val) => setSelectedDocs({ ...selectedDocs, doc1: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie Dokument 1" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.file_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Dokument 2</label>
              <Select value={selectedDocs.doc2 || ''} onValueChange={(val) => setSelectedDocs({ ...selectedDocs, doc2: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie Dokument 2" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.file_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCompare} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Vergleich läuft...
              </>
            ) : (
              '🔍 Dokumente vergleichen'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {comparison && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vergleichsergebnis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Ähnlichkeit</span>
                  <Badge>{comparison.similarity_percentage}%</Badge>
                </div>
                <Progress value={comparison.similarity_percentage} />
              </div>

              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-900">{comparison.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs p-2 bg-gray-50 rounded">
                  <p className="font-medium">Ähnlichkeiten</p>
                  <p className="text-gray-600">{comparison.similarities?.length || 0}</p>
                </div>
                <div className="text-xs p-2 bg-gray-50 rounded">
                  <p className="font-medium">Unterschiede</p>
                  <p className="text-gray-600">
                    {(comparison.differences?.only_in_doc1?.length || 0) + (comparison.differences?.only_in_doc2?.length || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similarities */}
          {comparison.similarities && comparison.similarities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✅ Ähnlichkeiten</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {comparison.similarities.map((sim, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-green-600">•</span>
                      <span>{sim}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Differences */}
          {comparison.differences && (
            <div className="space-y-4">
              {comparison.differences.only_in_doc1 && comparison.differences.only_in_doc1.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">📄 Nur in Dokument 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {comparison.differences.only_in_doc1.map((diff, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-red-600">-</span>
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {comparison.differences.only_in_doc2 && comparison.differences.only_in_doc2.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">📄 Nur in Dokument 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {comparison.differences.only_in_doc2.map((diff, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-blue-600">+</span>
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Changes */}
          {comparison.changes && comparison.changes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔄 Änderungen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {comparison.changes.map((change, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-yellow-600">≈</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}