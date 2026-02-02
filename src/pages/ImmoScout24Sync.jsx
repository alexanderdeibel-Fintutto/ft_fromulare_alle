import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Globe, Mail } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function ImmoScout24Sync() {
  const [step, setStep] = useState('select');
  const [loading, setLoading] = useState(false);
  const [propertyId, setPropertyId] = useState('');
  const [action, setAction] = useState('publish');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAction = async (e) => {
    e?.preventDefault();
    if (!propertyId.trim()) {
      setError('Bitte geben Sie eine Immobilien-ID ein');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('immoscout24-sync', {
        action,
        property_id: propertyId,
        app: 'vermietify'
      });

      if (response.data.success) {
        setResult(response.data);
        setStep('result');
        await base44.analytics.track({
          eventName: 'property_synced',
          properties: { action, property_id: propertyId }
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
                Immobilie synchronisiert
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {result.action === 'published' && (
                  <>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Portal Listing ID</p>
                      <p className="font-mono font-bold">{result.portal_listing_id}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 mb-1">Listing-URL</p>
                      <a href={result.listing_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
                        {result.listing_url}
                      </a>
                    </div>
                  </>
                )}

                {result.action === 'published' && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      ✓ Ihre Immobilie ist jetzt auf ImmobilienScout24 sichtbar und Anfragen werden zu Ihnen weitergeleitet!
                    </p>
                  </div>
                )}

                {result.inquiries_count && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600 mb-1">Aktuelle Anfragen</p>
                    <p className="text-2xl font-bold text-orange-700">{result.inquiries_count}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => { setStep('select'); setResult(null); }} variant="outline">
              Zurück
            </Button>
            <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">
              Beleg drucken
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">ImmobilienScout24 Sync</h1>
          <p className="text-gray-600 mt-2">Veröffentlichen Sie Ihre Objekte direkt auf Deutschlands größtes Immobilien-Portal</p>
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

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl">👥</p>
              <p className="font-bold mt-2">8 Mio.+</p>
              <p className="text-xs text-gray-600 mt-1">Monatliche Nutzer</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl">🏠</p>
              <p className="font-bold mt-2">1,2 Mio.+</p>
              <p className="text-xs text-gray-600 mt-1">Aktive Inserate</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Immobilie verwalten
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAction} className="space-y-6">
              {/* Immobilien-ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Immobilien-ID *</label>
                <input
                  type="text"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="z.B. PROP-2026-001"
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Die ID der Immobilie in Ihrem System</p>
              </div>

              {/* Aktion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktion *</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="publish"
                      checked={action === 'publish'}
                      onChange={(e) => setAction(e.target.value)}
                    />
                    <div>
                      <p className="font-medium">📤 Veröffentlichen</p>
                      <p className="text-sm text-gray-600">Immobilie auf IS24 veröffentlichen</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="get_inquiries"
                      checked={action === 'get_inquiries'}
                      onChange={(e) => setAction(e.target.value)}
                    />
                    <div>
                      <p className="font-medium">📧 Anfragen abrufen</p>
                      <p className="text-sm text-gray-600">Aktuelle Mietanfragen abrufen</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900">
                  💡 Hinweis: Sie müssen sich zuerst mit Ihrem ImmobilienScout24-Konto authentifizieren. Die Verbindung erfolgt sicher über OAuth.
                </p>
              </div>

              {loading ? (
                <LoadingState message="Wird synchronisiert..." />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg"
                >
                  {action === 'publish' ? 'Veröffentlichen' : 'Anfragen abrufen'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}