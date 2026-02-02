import React, { useState } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import AppHeader from '../components/layout/AppHeader';

const CSV_TEMPLATE = `document_id,shared_with_email,access_level,target_app
doc123,user@example.com,download,ft-formulare
doc456,user2@example.com,view,vermietify`;

export default function AdminShareManagement() {
  const [file, setFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        document_id: values[0],
        shared_with_email: values[1],
        access_level: values[2],
        target_app: values[3] || 'ft-formulare'
      };
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const text = await selectedFile.text();
    setCsvText(text);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      toast.error('CSV-Inhalt ist leer');
      return;
    }

    try {
      setLoading(true);
      const sharesData = parseCSV(csvText);

      if (sharesData.length === 0) {
        toast.error('Keine gültigen Einträge gefunden');
        return;
      }

      const response = await base44.functions.invoke('bulkImportShares', {
        shares_data: sharesData
      });

      setResults({
        imported: response.data.imported || 0,
        failed: response.data.failed || 0,
        total: sharesData.length
      });

      toast.success(`${response.data.imported} Freigaben importiert`);
    } catch (error) {
      toast.error('Import fehlgeschlagen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Share-Verwaltung
        </h1>
        <p className="text-gray-600 mb-8">
          Verwalte Dokumentfreigaben im Bulk über CSV-Import
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            CSV Upload
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'template'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border'
            }`}
          >
            <FileUp className="w-4 h-4 inline mr-2" />
            Template
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* CSV Input */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                CSV-Datei importieren
              </h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="pointer-events-none">
                    <FileUp className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">
                      {file ? file.name : 'CSV-Datei hier ablegen oder klicken'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max 10MB, CSV-Format
                    </p>
                  </div>
                </div>

                {/* Or paste CSV */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oder CSV hier einfügen:
                  </label>
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={CSV_TEMPLATE}
                    className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="8"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Spalten: document_id, shared_with_email, access_level (view/download/edit), target_app (optional)
                  </p>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={loading || !csvText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Wird importiert...' : 'Importieren'}
                </Button>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className={`rounded-lg p-6 ${
                results.failed === 0
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  {results.failed === 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${
                      results.failed === 0 ? 'text-green-900' : 'text-amber-900'
                    }`}>
                      Import abgeschlossen
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>✅ Erfolgreich: <strong>{results.imported}</strong></li>
                      {results.failed > 0 && (
                        <li>❌ Fehlerhafte: <strong>{results.failed}</strong></li>
                      )}
                      <li>📊 Gesamt: <strong>{results.total}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'template' && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              CSV-Template
            </h2>
            <p className="text-gray-600 mb-4">
              Kopiere diese Vorlage und fülle sie mit deinen Daten:
            </p>
            <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                {CSV_TEMPLATE}
              </pre>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <strong>document_id:</strong>
                <p className="text-gray-600">ID des Dokuments, das geteilt werden soll</p>
              </div>
              <div>
                <strong>shared_with_email:</strong>
                <p className="text-gray-600">E-Mail-Adresse des Empfängers</p>
              </div>
              <div>
                <strong>access_level:</strong>
                <p className="text-gray-600">
                  Zugriffslevel: <code className="bg-gray-200 px-2 py-1 rounded">view</code>, 
                  <code className="bg-gray-200 px-2 py-1 rounded ml-2">download</code>, oder 
                  <code className="bg-gray-200 px-2 py-1 rounded ml-2">edit</code>
                </p>
              </div>
              <div>
                <strong>target_app (optional):</strong>
                <p className="text-gray-600">Ziel-App, Standard: ft-formulare</p>
              </div>
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(CSV_TEMPLATE);
                toast.success('Template kopiert!');
              }}
              className="mt-4"
            >
              Template kopieren
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}