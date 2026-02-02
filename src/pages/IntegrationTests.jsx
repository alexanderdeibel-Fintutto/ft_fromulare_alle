import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, XCircle, Loader, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function IntegrationTests() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('integration-test-suite', {});
      setResults(response.data);
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integration Tests</h1>
            <p className="text-gray-600 mt-2">Teste alle Service-Integrationen Ende-zu-Ende</p>
          </div>
          <Button onClick={runTests} disabled={loading} className="gap-2">
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Tests ausführen
          </Button>
        </div>

        {/* Results */}
        {results && !results.error && (
          <>
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Test Ergebnisse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{results.tests_passed}</p>
                    <p className="text-sm text-gray-600">Bestanden</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{results.tests_failed}</p>
                    <p className="text-sm text-gray-600">Fehlgeschlagen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{results.pass_rate}</p>
                    <p className="text-sm text-gray-600">Erfolgsquote</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 rounded-lg border-2 text-center font-semibold" 
                  style={{
                    backgroundColor: results.overall_status === 'ALL_PASSED' ? '#D1FAE5' : '#FEE2E2',
                    borderColor: results.overall_status === 'ALL_PASSED' ? '#10B981' : '#EF4444',
                    color: results.overall_status === 'ALL_PASSED' ? '#065F46' : '#991B1B'
                  }}>
                  {results.overall_status === 'ALL_PASSED' ? '✓ Alle Tests bestanden' : '⚠ Einige Tests fehlgeschlagen'}
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Ausgeführt: {new Date(results.timestamp).toLocaleString('de-DE')}
                </p>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <div className="space-y-3">
              {results.details.map((test, i) => (
                <Card key={i} className={`border-2 ${getStatusColor(test.status)}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <h3 className="font-semibold">{test.test}</h3>
                        <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        test.status === 'passed' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {test.status.toUpperCase()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {results && results.error && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900">Fehler beim Ausführen der Tests</h3>
                  <p className="text-sm text-red-700 mt-1">{results.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!results && !loading && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Klicke auf "Tests ausführen" um zu starten</p>
            </CardContent>
          </Card>
        )}

        {/* Test Info */}
        <Card>
          <CardHeader>
            <CardTitle>Test Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1. Database Connection:</strong> Prüft Supabase Verbindung</p>
              <p><strong>2. Services Registry:</strong> Validiert registrierte Services</p>
              <p><strong>3. Edge Functions:</strong> Testet LetterXpress Function</p>
              <p><strong>4. Service Usage Log:</strong> Prüft Logging-Funktionalität</p>
              <p><strong>5. Rate Limiting:</strong> Validiert Limit-Konfiguration</p>
              <p><strong>6. Webhook Handler:</strong> Testet Webhook-Endpoint</p>
              <p><strong>7. Analytics API:</strong> Prüft Analytics Dashboard</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}