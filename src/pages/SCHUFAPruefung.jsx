import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, TrendingDown, Shield, Zap } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';
import SuccessAnimation from '@/components/feedback/SuccessAnimation';

export default function SCHUFAPruefung() {
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    geburtsdatum: '',
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    einwilligung: false
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.einwilligung) {
      setError('Bitte akzeptieren Sie die Datenschutzerklärung');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('schufa-check', {
        person: {
          vorname: formData.vorname,
          nachname: formData.nachname,
          geburtsdatum: formData.geburtsdatum,
          strasse: formData.strasse,
          hausnummer: formData.hausnummer,
          plz: formData.plz,
          ort: formData.ort
        },
        einwilligung_vorhanden: formData.einwilligung,
        app: 'vermietify'
      });

      await base44.analytics.track({
        eventName: 'schufa_check_initiated',
        properties: { success: response.data.success }
      });

      if (response.data.success) {
        setResult(response.data.schufa_result);
        setStep('result');
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">SCHUFA-Bonitätsabfrage</h1>
            <p className="text-gray-600 mt-2">Ergebnis für {formData.vorname} {formData.nachname}</p>
          </div>

          {/* Score Card */}
          <Card className="mb-6 border-2">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bonitätsscore</CardTitle>
                  <p className="text-indigo-100 mt-1">Erfüllungswahrscheinlichkeit</p>
                </div>
                <div className="text-6xl font-bold">{result.score}%</div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Risikoklasse</p>
                  <p className="text-lg font-bold mt-2">{result.risiko_bewertung}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Score-Klasse</p>
                  <p className="text-lg font-bold mt-2">{result.score_klasse}</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm text-indigo-900">Empfehlung</p>
                  <p className="text-lg font-bold text-indigo-600 mt-2">{result.empfehlung}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card className="mb-6 border-l-4 border-indigo-500">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {result.empfehlung === 'EMPFOHLEN' && <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />}
                {result.empfehlung === 'NICHT_EMPFOHLEN' && <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />}
                {result.empfehlung === 'BEDINGT_EMPFOHLEN' && <TrendingDown className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" />}
                <div>
                  <h3 className="font-bold text-lg mb-2">{result.empfehlung}</h3>
                  <p className="text-gray-700">{result.empfehlung_text}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Negativmerkmale */}
          {result.negativmerkmale.vorhanden && (
            <Card className="mb-6 border-l-4 border-red-500">
              <CardHeader>
                <CardTitle className="text-red-600">⚠️ Negativmerkmale</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.negativmerkmale.details.map((m, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      • {m.art} ({m.datum}) {m.betrag ? `€${m.betrag}` : ''}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Vertragsbeziehungen */}
          <Card>
            <CardHeader>
              <CardTitle>Vertragsbeziehungen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold mb-4">{result.vertragsbeziehungen.anzahl} aktive Verträge</p>
              <div className="grid grid-cols-2 gap-4">
                {result.vertragsbeziehungen.kategorien?.map((k, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">{k.typ}</p>
                    <p className="text-lg font-bold">{k.anzahl}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex gap-4 justify-center">
            <Button onClick={() => { setStep('form'); setResult(null); }} variant="outline">
              Neue Abfrage
            </Button>
            <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700">
              Drucken
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">SCHUFA-Bonitätsprüfung</h1>
          <p className="text-gray-600 mt-2">Sofort-Ergebnis für sichere Mieterauswahl</p>
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

        <Card>
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Bewerberdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vorname *</label>
                  <Input
                    name="vorname"
                    value={formData.vorname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nachname *</label>
                  <Input
                    name="nachname"
                    value={formData.nachname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geburtsdatum *</label>
                <Input
                  type="date"
                  name="geburtsdatum"
                  value={formData.geburtsdatum}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Straße & Hausnummer *</label>
                  <Input
                    name="strasse"
                    placeholder="z.B. Musterstraße 10"
                    value={formData.strasse}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hausnummer</label>
                  <Input
                    name="hausnummer"
                    placeholder="10"
                    value={formData.hausnummer}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PLZ *</label>
                  <Input
                    name="plz"
                    placeholder="12345"
                    value={formData.plz}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ort *</label>
                  <Input
                    name="ort"
                    placeholder="Berlin"
                    value={formData.ort}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="einwilligung"
                    checked={formData.einwilligung}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    Ich willige ein, dass die SCHUFA-Abfrage durchgeführt wird und bestätige die Richtigkeit aller Angaben. Dies ist notwendig zur Prüfung der Bonität für das Mietverhältnis. *
                  </span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Zap className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Kosten: €29,95</p>
                    <p className="text-sm text-blue-800 mt-1">Ergebnis in Sekundenschnelle</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <LoadingState message="SCHUFA wird abgefragt..." />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                  disabled={!formData.einwilligung}
                >
                  Bonitätsprüfung starten
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}