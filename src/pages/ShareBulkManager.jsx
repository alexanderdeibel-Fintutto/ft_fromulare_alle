import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Loader } from 'lucide-react';
import { toast } from 'sonner';

const CSV_TEMPLATE = `document_id,shared_with_email,access_level,expires_at
doc-123,user@example.com,download,2026-02-26
doc-456,another@example.com,view,2026-03-26`;

export default function ShareBulkManager() {
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error('CSV eingeben');
      return;
    }

    setLoading(true);
    try {
      const lines = csvContent.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const shares = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          document_id: values[0],
          shared_with_email: values[1],
          access_level: values[2] || 'download',
          expires_at: values[3] || null
        };
      });

      const response = await base44.functions.invoke('bulkImportShares', {
        shares_data: shares
      });

      setResult(response.data);
      toast.success(`${response.data.success} Shares importiert`);
      setCsvContent('');
    } catch (error) {
      toast.error('Import fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('bulkExportShares', {});
      
      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      
      toast.success('Exportiert');
    } catch (error) {
      toast.error('Export fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Bulk Share Manager</h1>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="w-4 h-4" />
            Importieren
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="w-4 h-4" />
            Exportieren
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">CSV Daten</label>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={CSV_TEMPLATE}
                rows={10}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                disabled={loading}
              />
            </div>

            <Button 
              onClick={handleImport} 
              disabled={loading} 
              className="w-full gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Importieren
            </Button>
          </Card>

          {result && (
            <Card className="p-6 bg-green-50">
              <h3 className="font-medium text-green-900 mb-2">Import abgeschlossen</h3>
              <p className="text-sm text-green-700">Erfolgreich: {result.success}</p>
              <p className="text-sm text-red-700">Fehler: {result.failed}</p>
              {result.errors.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
                </ul>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export">
          <Card className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Alle deine Shares als CSV exportieren</p>
            <Button 
              onClick={handleExport} 
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Exportieren
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}