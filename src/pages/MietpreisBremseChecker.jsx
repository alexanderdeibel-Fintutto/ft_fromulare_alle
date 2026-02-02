import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function MietpreisBremseChecker() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plz: '',
    mietspiegel_wert: '',
    geplante_miete: '',
    wohnflaeche_qm: '',
    neubau_nach_2014: false,
    umfassende_modernisierung: false,
    vormiete_hoehe: ''
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
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('check-mietpreisbremse', {
        plz: formData.plz,
        mietspiegel_wert: formData.mietspiegel_wert ? parseFloat(formData.mietspiegel_wert) : undefined,
        geplante_miete: formData.geplante_miete ? parseFloat(formData.geplante_miete) : undefined,
        wohnflaeche_qm: formData.wohnflaeche_qm ? parseFloat(formData.wohnflaeche_qm) : undefined,
        ausnahmen: {
          neubau_nach_2014: formData.neubau_nach_2014,
          umfassende_modernisierung: formData.umfassende_modernisierung,
          vormiete_hoehe: formData.vormiete_hoehe ? parseFloat(formData.vormiete_hoehe) : undefined
        },
        app: 'vermietify'
      });

      if (response.data.success) {
        setResult(response.data.result);
        await base44.analytics.track({
          eventName: 'mietpreisbremse_checked',
          properties: { plz: formData.plz }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Mietpreisbremse Checker</h1>
          <p className="text-gray-600 mt-2">Ist die geplante Miete zulässig?</p>
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

        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle>Mietpreisbremse-Kriterien</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Postleitzahl */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postleitzahl (PLZ) *</label>
                <Input
                  name="plz"
                  value={formData.plz}
                  onChange={handleInputChange}
                  placeholder="12345"
                  required
                  maxLength="5"
                />
                <p className="text-xs text-gray-500 mt-1">Die PLZ bestimmt, ob die Mietpreisbremse gilt</p>
              </div>

              {/* Mietspiegel */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4">Mietspiegelwerte</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mietspiegel-Wert (€/m²)</label>
                    <Input
                      name="mietspiegel_wert"
                      type="number"
                      step="0.01"
                      value={formData.mietspiegel_wert}
                      onChange={handleInputChange}
                      placeholder="z.B. 8.50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Durchschnittliche Vergleichsmiete in der Gegend</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wohnfläche (m²)</label>
                    <Input
                      name="wohnflaeche_qm"
                      type="number"
                      value={formData.wohnflaeche_qm}
                      onChange={handleInputChange}
                      placeholder="75"
                    />
                  </div>
                </div>
              </div>

              {/* Geplante Miete */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Geplante Miete (€/Monat)</label>
                <Input
                  name="geplante_miete"
                  type="number"
                  step="0.01"
                  value={formData.geplante_miete}
                  onChange={handleInputChange}
                  placeholder="z.B. 750.00"
                />
              </div>

              {/* Ausnahmen */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4">Ausnahmen von der Mietpreisbremse</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="neubau_nach_2014"
                      checked={formData.neubau_nach_2014}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">Neubau nach 01.10.2014</p>
                      <p className="text-sm text-gray-600">Wohnungen, deren Bezug nach 01.10.2014 möglich war</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="umfassende_modernisierung"
                      checked={formData.umfassende_modernisierung}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">Umfassende Modernisierung</p>
                      <p className="text-sm text-gray-600">Wenn die Baukosten mind. 25% des Verkehrswerts betrugen</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="neubau_nach_2014"
                      className="mt-1 hidden"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Vormiete war bereits höher</p>
                      <p className="text-sm text-gray-600">Bestandsschutz - Vormiete eingeben:</p>
                      <Input
                        name="vormiete_hoehe"
                        type="number"
                        step="0.01"
                        value={formData.vormiete_hoehe}
                        onChange={handleInputChange}
                        placeholder="€"
                        className="mt-2"
                      />
                    </div>
                  </label>
                </div>
              </div>

              {loading ? (
                <LoadingState message="Wird geprüft..." />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                >
                  Mietpreisbremse prüfen
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Gebiet */}
            <Card className="border-l-4 border-purple-500">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bundesland</p>
                    <p className="font-bold">{result.bundesland || 'Keine Mietpreisbremse'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-bold ${result.gilt_mietpreisbremse ? 'text-red-600' : 'text-green-600'}`}>
                      {result.gilt_mietpreisbremse ? '✓ GILT' : '✗ GILT NICHT'}
                    </p>
                  </div>
                  {result.gueltig_bis && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Gültig bis</p>
                      <p className="font-bold">{result.gueltig_bis}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ausnahme */}
            {result.ausnahme && (
              <Card className="border-l-4 border-yellow-500 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-yellow-900">{result.ausnahme.grund}</p>
                      <p className="text-yellow-800 mt-1">{result.ausnahme.beschreibung}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Berechnung */}
            {result.berechnung && (
              <Card>
                <CardHeader>
                  <CardTitle>Zulässige Höchstmiete</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Mietspiegel-Wert</p>
                        <p className="text-lg font-bold mt-1">€{result.berechnung.mietspiegel_wert}/m²</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">+ Zuschlag</p>
                        <p className="text-lg font-bold mt-1">{result.berechnung.zuschlag_prozent}%</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                        <p className="text-sm text-indigo-600">Max. pro m²</p>
                        <p className="text-lg font-bold text-indigo-700 mt-1">€{result.berechnung.max_miete_pro_qm}/m²</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                        <p className="text-sm text-indigo-600">Max. Gesamt</p>
                        <p className="text-lg font-bold text-indigo-700 mt-1">€{result.berechnung.max_miete_gesamt}</p>
                      </div>
                    </div>

                    {result.berechnung.geplante_miete && (
                      <div className="border-t pt-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600">Geplante Miete</p>
                            <p className="text-lg font-bold text-blue-700 mt-1">€{result.berechnung.geplante_miete}</p>
                          </div>
                          <div className={`p-4 rounded-lg ${result.berechnung.miete_zulaessig ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                            <p className={`text-sm ${result.berechnung.miete_zulaessig ? 'text-green-600' : 'text-red-600'}`}>
                              {result.berechnung.miete_zulaessig ? '✓ Zulässig' : '✗ Überschreitung'}
                            </p>
                            <p className={`text-lg font-bold mt-1 ${result.berechnung.miete_zulaessig ? 'text-green-700' : 'text-red-700'}`}>
                              {result.berechnung.differenz >= 0 ? '+' : ''}€{result.berechnung.differenz}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hinweis */}
            <Card className="border-l-4 border-blue-500">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-blue-900">{result.hinweis}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}