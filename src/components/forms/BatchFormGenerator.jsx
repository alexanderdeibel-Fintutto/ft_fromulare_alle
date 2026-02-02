import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Batch Form Generator
 * Generiert mehrere Dokumente aus CSV/JSON auf einmal
 */

export default function BatchFormGenerator({
  templateSchema,
  templateName,
  onGenerateBatch
}) {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState('csv');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = format === 'csv' ? parseCSV(content) : JSON.parse(content);

      setFiles(data);
      toast.success(`${data.length} Datensätze geladen`);
    } catch (error) {
      toast.error('Dateiformat ungültig');
      console.error(error);
    }
  }

  function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = values[i];
      });
      return obj;
    });
  }

  async function generateBatch() {
    if (files.length === 0) {
      toast.error('Bitte laden Sie eine Datei hoch');
      return;
    }

    setGenerating(true);
    setResults([]);
    const batchResults = [];

    try {
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await onGenerateBatch?.(files[i]);
          batchResults.push({
            index: i + 1,
            data: files[i],
            status: 'success',
            fileName: result?.file_name,
            fileUrl: result?.file_url
          });
        } catch (error) {
          batchResults.push({
            index: i + 1,
            data: files[i],
            status: 'error',
            error: error.message
          });
        }

        setProgress(((i + 1) / files.length) * 100);
      }

      setResults(batchResults);
      toast.success(`${batchResults.filter(r => r.status === 'success').length}/${files.length} Dokumente generiert`);
    } catch (error) {
      toast.error('Batch-Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  }

  function exportResults() {
    const csv = results
      .map(r => `"${r.index}","${r.status}","${r.fileName || r.error}"`)
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_results_${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📁 Datendatei hochladen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Dateiformat</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Datei auswählen</label>
            <Input
              type="file"
              accept={format === 'csv' ? '.csv' : '.json'}
              onChange={handleFileUpload}
            />
          </div>

          {files.length > 0 && (
            <div className="p-3 bg-blue-50 rounded text-sm">
              ✓ {files.length} Datensätze geladen
            </div>
          )}

          <Button
            onClick={generateBatch}
            disabled={files.length === 0 || generating}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {generating ? '⏳ Wird generiert...' : '🚀 Batch-Generierung starten'}
          </Button>
        </CardContent>
      </Card>

      {/* Progress */}
      {generating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generierungsfortschritt</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">✓ Ergebnisse</CardTitle>
              <Button onClick={exportResults} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, i) => (
                <div key={i} className="flex items-start gap-3 p-2 border rounded">
                  {result.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Datensatz #{result.index}</p>
                    {result.status === 'success' ? (
                      <a
                        href={result.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {result.fileName} ↗
                      </a>
                    ) : (
                      <p className="text-xs text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}