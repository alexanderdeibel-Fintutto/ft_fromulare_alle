import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function IndexmieteAnpassung() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ausgangsmiete: '',
    basisindex: '',
    basismonat: '01',
    basisjahr: new Date().getFullYear() - 1,
    aktuellerindex: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('fetch-vpi', {
        jahr: new Date().getFullYear(),
        app: 'vermietify'
      });

      if (response.data.success && response.data.aktuell) {
        const basisWert = parseFloat(formData.basisindex);
        const aktuellerWert = response.data.aktuell.index;
        const ausgangsmiete = parseFloat(formData.ausgangsmiete);

        const veraenderung = ((aktuellerWert - basisWert) / basisWert) * 100;
        const neueIndexmiete = ausgangsmiete * (aktuellerWert / basisWert);

        setResult({
          basisindex: basisWert,
          aktuellerindex: aktuellerWert,
          veraenderung: veraenderung.toFixed(2),
          ausgangsmiete,
          neueIndexmiete: neueIndexmiete.toFixed(2),
          erhoehung: (neueIndexmiete - ausgangsmiete).toFixed(2),
          vpiDaten: response.data
        });

        await base44.analytics.track({
          eventName: 'indexmiete_calculated',
          properties: { veraenderung: parseFloat(veraenderung.toFixed(2)) }
        });
      } else {
        setError(response.data.error || 'VPI-Abruf fehlgeschlagen');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Indexmiete-Anpassung</h1>
          <p className="text-gray-600 mt-2">Neue Miete nach Verbraucherpreisindex (VPI) berechnen</p>
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
              <p className="text-sm text-gray-600">Rechtsgrundlage</p>
              <p className="font-bold mt-2">§ 557a BGB</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Datenquelle</p>
              <p className="font-bold mt-2">Destatis (Bundesamt)</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Aktualisierung</p>
              <p className="font-bold mt-2">Monatlich</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Miete berechnen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ausgangsmiete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ausgangsmiete (€/Monat) *</label>
                <Input
                  name="ausgangsmiete"
                  type="number"
                  step="0.01"
                  value={formData.ausgangsmiete}
                  onChange={handleInputChange}
                  placeholder="750.00"
                  required
                />
              </div>

              {/* Basis-Index */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4">Basis-Verbraucherpreisindex</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Index-Wert *</label>
                    <Input
                      name="basisindex"
                      type="number"
                      step="0.01"
                      value={formData.basisindex}
                      onChange={handleInputChange}
                      placeholder="z.B. 110.5"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Basis 2020 = 100</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monat</label>
                    <select
                      name="basismonat"
                      value={formData.basismonat}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jahr</label>
                    <Input
                      name="basisjahr"
                      type="number"
                      value={formData.basisjahr}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  💡 Der Basis-Index ist der VPI im Monat, in dem der Mietvertrag geschlossen wurde oder zuletzt Regelanpassung erfolgte.
                </p>
              </div>

              {loading ? (
                <LoadingState message="VPI wird abgerufen..." />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Neue Miete berechnen
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="mt-8 space-y-6">
            {/* VPI-Vergleich */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader>
                <CardTitle>Verbraucherpreisindex (VPI)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    <p className="text-sm text-gray-600">Basis-Index (Vorvertrag)</p>
                    <p className="text-2xl font-bold text-gray-700 mt-2">{result.basisindex}</p>
                    <p className="text-xs text-gray-500 mt-1">{formData.basismonat}/{formData.basisjahr}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                    <p className="text-sm text-blue-600">Aktueller Index</p>
                    <p className="text-2xl font-bold text-blue-700 mt-2">{result.aktuellerindex}</p>
                    <p className="text-xs text-blue-500 mt-1">Aktuell</p>
                  </div>
                  <div className={`p-4 rounded-lg border-2 ${parseFloat(result.veraenderung) >= 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <p className={`text-sm ${parseFloat(result.veraenderung) >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      Veränderung
                    </p>
                    <p className={`text-2xl font-bold mt-2 ${parseFloat(result.veraenderung) >= 0 ? 'text-orange-700' : 'text-green-700'}`}>
                      {result.veraenderung}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mietberechnung */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <CardTitle>Mietanpassung</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <p className="text-sm text-gray-600">Ausgangsmiete</p>
                    <p className="text-3xl font-bold text-gray-700 mt-2">€{result.ausgangsmiete}</p>
                    <p className="text-xs text-gray-500 mt-2">Bisherige Miete/Monat</p>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-sm text-blue-600">Neue Indexmiete</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">€{result.neueIndexmiete}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      {parseFloat(result.erhoehung) >= 0 ? '+' : ''}€{result.erhoehung}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">
                    📌 Hinweis: Eine Anpassung ist erst nach mind. 12 Monaten seit der letzten Indexanpassung möglich!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* VPI-Verlauf */}
            {result.vpiDaten?.verlauf && (
              <Card>
                <CardHeader>
                  <CardTitle>VPI-Verlauf (letzte 12 Monate)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.vpiDaten.verlauf.map((v, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{v.monat}/{v.jahr}</span>
                        <span className="font-mono font-bold">{v.index}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}