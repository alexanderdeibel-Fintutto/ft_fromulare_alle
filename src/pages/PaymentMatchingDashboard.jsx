import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function PaymentMatchingDashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFetchMatching = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('finapi-match', {
        app: 'vermietify'
      });

      if (response.data.success) {
        setResult(response.data);
        await base44.analytics.track({
          eventName: 'payments_matched',
          properties: {
            total: response.data.total_transactions,
            auto_matched: response.data.auto_matched
          }
        });
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Zahlungszuordnung (KI-Matching)</h1>
          <p className="text-gray-600 mt-2">Automatische Zuordnung von Banktransaktionen zu Mietern</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!result ? (
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                KI-gestützte Zahlungszuordnung
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-600 mb-2">Funktionsweise</p>
                    <p className="font-bold">🤖 KI-Analyse</p>
                    <p className="text-xs text-gray-600 mt-2">Vergleicht Transaktionen mit Mieter-Daten</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 mb-2">Ergebnis</p>
                    <p className="font-bold">✓ Automatisch</p>
                    <p className="text-xs text-gray-600 mt-2">70-90% vollautomatische Zuordnung</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 mb-2">Zeitersparnis</p>
                    <p className="font-bold">⏱️ Sofort</p>
                    <p className="text-xs text-gray-600 mt-2">Echtzeitabgleich von Banktransaktionen</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💡 Die KI vergleicht: Zahlungsbetrag, Mieter-Name, Adresse, historische Zahlungsmuster und nutzt Fuzzy-Matching für Abweichungen.
                  </p>
                </div>

                {loading ? (
                  <LoadingState message="Transaktionen werden analysiert..." />
                ) : (
                  <Button
                    onClick={handleFetchMatching}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Zahlungen abgleichen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Übersicht */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-l-4 border-blue-500">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-600">Gesamt</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{result.total_transactions}</p>
                  <p className="text-xs text-gray-500 mt-1">Transaktionen</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-green-500">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-600">Automatisch</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{result.auto_matched}</p>
                  <p className="text-xs text-gray-500 mt-1">Zugeordnet</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-yellow-500">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-600">Überprüfung</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{result.needs_review}</p>
                  <p className="text-xs text-gray-500 mt-1">Benötigen Überprüfung</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-red-500">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-600">Manuell</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{result.manual_required}</p>
                  <p className="text-xs text-gray-500 mt-1">Zu prüfen</p>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Matching-Ergebnisse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.results.map((r, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4"
                      style={{
                        borderLeftColor: r.auto_matched ? '#10B981' : r.suggested_action === 'review' ? '#F59E0B' : '#EF4444'
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold">TX-{idx + 1} ({r.transaction_id})</p>
                          <p className="text-sm text-gray-600 mt-1">{r.match_reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold px-3 py-1 rounded ${
                            r.auto_matched ? 'bg-green-100 text-green-800' :
                            r.suggested_action === 'review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {r.auto_matched ? 'Automatisch' : r.suggested_action === 'review' ? 'Review' : 'Manuell'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{r.tenant_id || 'Kein Match'}</span>
                        <span className="font-bold">{r.confidence}% Sicherheit</span>
                      </div>
                      {r.amount_deviation && (
                        <p className="text-xs text-orange-600 mt-2">
                          ⚠️ Betragabweichung: €{r.amount_deviation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => setResult(null)} variant="outline">
                Nochmal abgleichen
              </Button>
              <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700">
                Bericht drucken
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}