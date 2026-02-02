import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, AlertTriangle, Loader } from 'lucide-react';

export default function SupabaseIntegrityDashboard() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runIntegrityCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await base44.functions.invoke('checkSupabaseIntegrity');
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'healthy') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusBgColor = (status) => {
    if (status === 'healthy') return 'bg-green-50';
    if (status === 'warning') return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integritätsprüfungs-Dashboard</h1>
          <p className="text-gray-600">Überprüfe die Integrität deiner Supabase- und Anthropic-Konfiguration</p>
        </div>

        <Button 
          onClick={runIntegrityCheck}
          disabled={loading}
          className="mb-6 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Prüfung läuft...
            </>
          ) : (
            'Integritätsprüfung starten'
          )}
        </Button>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {results && (
          <>
            {/* Overall Status */}
            <Card className={`mb-6 border-2 ${
              results.status === 'healthy' ? 'border-green-200' :
              results.status === 'warning' ? 'border-yellow-200' :
              'border-red-200'
            } ${getStatusBgColor(results.status)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(results.status)}
                    <div>
                      <CardTitle className="text-xl">
                        Gesamtstatus: {results.status.toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        {results.timestamp && new Date(results.timestamp).toLocaleString('de-DE')}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Auth Check */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(results.checks.auth.status)}
                  Authentifizierung
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.checks.auth.error ? (
                  <p className="text-red-600">{results.checks.auth.error}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Registrierte Nutzer</p>
                      <p className="text-2xl font-bold">{results.checks.auth.userCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-lg font-semibold text-green-600">Aktiv</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tables Check */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(results.checks.tables.status)}
                  Datenbankentitäten ({results.checks.tables.healthyCount}/{results.checks.tables.totalCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(results.checks.tables.tables).map(([table, info]) => (
                    <div key={table} className={`p-3 rounded border ${info.exists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center gap-2">
                        {info.exists ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-mono text-sm">{table}</span>
                      </div>
                      {info.error && <p className="text-xs text-red-600 mt-1">{info.error}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dependencies Check */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(results.checks.dependencies.status)}
                  Abhängigkeiten ({results.checks.dependencies.configuredCount}/{results.checks.dependencies.totalCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(results.checks.dependencies.dependencies).map(([key, status]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-mono text-sm">{key}</span>
                      <div className={`px-3 py-1 rounded text-sm font-semibold ${
                        status === 'configured' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Integrity Check */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(results.checks.dataIntegrity.status)}
                  Datenintegrität
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(results.checks.dataIntegrity.entities).map(([entity, info]) => (
                    <div key={entity} className="p-3 border rounded">
                      <p className="text-sm text-gray-600 capitalize">{entity}</p>
                      {info.error ? (
                        <p className="text-red-600 text-sm mt-1">{info.error}</p>
                      ) : (
                        <p className="text-2xl font-bold">{info.count || 0}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Anthropic Check */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(results.checks.anthropic.status)}
                  Anthropic KI Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded ${
                  results.checks.anthropic.status === 'healthy' ? 'bg-green-50 border border-green-200' :
                  results.checks.anthropic.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className="font-semibold mb-2">{results.checks.anthropic.status.toUpperCase()}</p>
                  <p className="text-sm">{results.checks.anthropic.message}</p>
                </div>
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card className="bg-gray-100">
              <CardHeader>
                <CardTitle className="text-sm">Debug-Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-96 bg-white p-4 rounded border">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}

        {!results && !loading && (
          <Card className="bg-gray-50">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-gray-500">Klicke "Integritätsprüfung starten" um den Report zu generieren</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}