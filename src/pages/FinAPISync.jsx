import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Zap, TrendingUp } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function FinAPISync() {
  const [step, setStep] = useState('select');
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const actions = [
    {
      id: 'connect_bank',
      title: 'Bankverbindung verbinden',
      description: 'Verbinden Sie Ihr Bankkonto für automatischen Transaktionsabgleich',
      icon: '🏦'
    },
    {
      id: 'sync_transactions',
      title: 'Transaktionen synchronisieren',
      description: 'Rufen Sie aktuelle Transaktionen ab und gleichen diese mit Mietern ab',
      icon: '💰'
    },
    {
      id: 'get_balance',
      title: 'Kontostand abrufen',
      description: 'Sehen Sie Ihren aktuellen Kontostand in Echtzeit',
      icon: '📊'
    }
  ];

  const handleAction = async (actionId) => {
    setLoading(true);
    setError(null);

    try {
      const payload = { action: actionId, app: 'vermietify' };
      
      if (actionId === 'sync_transactions') {
        payload.account_id = 'MOCK-ACC-001';
      }
      
      if (actionId === 'get_balance') {
        payload.account_id = 'MOCK-ACC-001';
      }

      const response = await base44.functions.invoke('finapi-sync', payload);

      if (response.data.success) {
        setResult(response.data);
        setStep('result');
        await base44.analytics.track({
          eventName: 'finapi_action',
          properties: { action: actionId }
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

  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Synchronisierung erfolgreich</h1>
          </div>

          <Card className="mb-6">
            <CardHeader className="bg-green-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {selectedAction?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {result.action === 'connect_bank' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 mb-2">Webform-URL</p>
                    <p className="font-mono text-sm break-all text-blue-800">{result.webform_url}</p>
                  </div>
                  <p className="text-gray-700">Bitte besuchen Sie die Webform-URL um Ihre Bankverbindung zu authentifizieren.</p>
                </div>
              )}
              
              {result.action === 'sync_transactions' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Transaktionen</p>
                      <p className="text-2xl font-bold text-gray-700 mt-2">{result.transactions_count}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-600">Benötigen Zuordnung</p>
                      <p className="text-2xl font-bold text-yellow-700 mt-2">{result.unmatched_count}</p>
                    </div>
                  </div>
                  <p className="text-gray-700">Die Transaktionen wurden synchronisiert und teilweise automatisch den Mietern zugeordnet.</p>
                </div>
              )}

              {result.action === 'get_balance' && (
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                    <p className="text-sm text-green-700 mb-2">Aktueller Kontostand</p>
                    <p className="text-4xl font-bold text-green-800">€{result.balance}</p>
                    <p className="text-sm text-green-600 mt-2">{result.currency}</p>
                  </div>
                  <p className="text-sm text-gray-600">Letzte Synchronisierung: {new Date(result.last_sync).toLocaleString('de-DE')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => { setStep('select'); setResult(null); }} variant="outline">
              Zurück
            </Button>
            <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">
              Drucken
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Banking Integration (finAPI)</h1>
          <p className="text-gray-600 mt-2">Verbinden Sie Ihr Bankkonto für automatische Zahlungszuordnung</p>
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

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl">🏦</p>
              <p className="font-bold mt-2">500+ Banken</p>
              <p className="text-xs text-gray-600 mt-1">Unterstützte Bankinstitute</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl">🔒</p>
              <p className="font-bold mt-2">PSD2 Standard</p>
              <p className="text-xs text-gray-600 mt-1">Maximale Sicherheit</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl">⚡</p>
              <p className="font-bold mt-2">Echtzeit</p>
              <p className="text-xs text-gray-600 mt-1">Live-Abgleich</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {actions.map(action => (
            <Card key={action.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{action.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{action.title}</h3>
                    <p className="text-gray-600 mb-4">{action.description}</p>
                    {loading && selectedAction?.id === action.id ? (
                      <LoadingState message="Wird verarbeitet..." size="sm" />
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedAction(action);
                          handleAction(action.id);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {action.title} <Zap className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              💡 <strong>Hinweis:</strong> Die finAPI-Integration ermöglicht automatischen Abgleich von Mietein- und Nachzahlungen mit Ihren Mietern. Ihre Bankdaten bleiben sicher und verschlüsselt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}