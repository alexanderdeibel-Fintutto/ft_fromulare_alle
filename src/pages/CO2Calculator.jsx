import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, BarChart3, Zap } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function CO2Calculator() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fuel_type: 'gas',
    consumption_m3: '',
    consumption_liter: '',
    consumption_kwh: '',
    wohnflaeche_qm: '100',
    year: new Date().getFullYear()
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
      const response = await base44.functions.invoke('calculate-co2', {
        fuel_type: formData.fuel_type,
        consumption_m3: formData.fuel_type === 'gas' ? parseFloat(formData.consumption_m3) : undefined,
        consumption_liter: formData.fuel_type === 'oil' ? parseFloat(formData.consumption_liter) : undefined,
        consumption_kwh: formData.consumption_kwh ? parseFloat(formData.consumption_kwh) : undefined,
        wohnflaeche_qm: parseFloat(formData.wohnflaeche_qm),
        year: parseInt(formData.year),
        app: 'vermietify'
      });

      if (response.data.success) {
        setResult(response.data.result);
        await base44.analytics.track({
          eventName: 'co2_calculated',
          properties: { fuel_type: formData.fuel_type }
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

  const fuelTypes = [
    { value: 'gas', label: 'Erdgas' },
    { value: 'oil', label: 'Heizöl' },
    { value: 'fernwaerme', label: 'Fernwärme' },
    { value: 'pellets', label: 'Pellets' },
    { value: 'waermepumpe', label: 'Wärmepumpe' },
    { value: 'kohle', label: 'Kohle' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">CO2-Kostenaufteilung</h1>
          <p className="text-gray-600 mt-2">Nach CO2KostAufG seit 2023 - Vermieter & Mieter Anteile berechnen</p>
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

        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-l-4 border-green-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">CO2-Kostenaufteilung</p>
                <p className="text-lg font-bold text-green-600 mt-2">Vermieter ↔ Mieter</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-l-4 border-blue-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Rechtliche Grundlage</p>
                <p className="text-lg font-bold text-blue-600 mt-2">CO2KostAufG</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-l-4 border-orange-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Stufensystem</p>
                <p className="text-lg font-bold text-orange-600 mt-2">10 Stufen</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              CO2-Daten eingeben
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Energieträger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Energieträger *</label>
                <select
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                >
                  {fuelTypes.map(ft => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>

              {formData.fuel_type === 'waermepumpe' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">✓ Wärmepumpen sind von der CO2-Umlage befreit!</p>
                </div>
              ) : (
                <>
                  {/* Verbrauch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verbrauch 2024 *
                      {formData.fuel_type === 'gas' && ' (m³)'}
                      {formData.fuel_type === 'oil' && ' (Liter)'}
                      {formData.fuel_type === 'fernwaerme' && ' (kWh)'}
                    </label>
                    {formData.fuel_type === 'gas' && (
                      <Input
                        name="consumption_m3"
                        type="number"
                        value={formData.consumption_m3}
                        onChange={handleInputChange}
                        placeholder="z.B. 1500"
                        required
                      />
                    )}
                    {formData.fuel_type === 'oil' && (
                      <Input
                        name="consumption_liter"
                        type="number"
                        value={formData.consumption_liter}
                        onChange={handleInputChange}
                        placeholder="z.B. 3000"
                        required
                      />
                    )}
                    {(formData.fuel_type === 'fernwaerme' || formData.fuel_type === 'pellets') && (
                      <Input
                        name="consumption_kwh"
                        type="number"
                        value={formData.consumption_kwh}
                        onChange={handleInputChange}
                        placeholder="z.B. 15000"
                        required
                      />
                    )}
                  </div>

                  {/* Wohnfläche */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wohnfläche (m²) *</label>
                    <Input
                      name="wohnflaeche_qm"
                      type="number"
                      value={formData.wohnflaeche_qm}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Jahr */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Abrechnungsjahr</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg"
                    >
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y} (€{y === 2024 ? 45 : y === 2025 ? 55 : y === 2026 ? 65 : 65}/t)</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {loading ? (
                <LoadingState message="Berechnung läuft..." />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Berechnen
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="mt-8 space-y-6">
            {/* Ergebnis */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle>CO2-Bilanz {result.year}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                    <p className="text-sm text-gray-600">CO2-Ausstoß</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{result.co2_kg} kg</p>
                    <p className="text-xs text-gray-500 mt-1">= {result.co2_tonnen} t</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                    <p className="text-sm text-gray-600">pro m²</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{result.co2_kg_pro_qm} kg</p>
                    <p className="text-xs text-gray-500 mt-1">Stufe {result.stufe}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-orange-200">
                    <p className="text-sm text-gray-600">CO2-Preis</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">€{result.co2_preis}/t</p>
                    <p className="text-xs text-gray-500 mt-1">Gesamt: €{result.co2_kosten_gesamt}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-red-200">
                    <p className="text-sm text-gray-600">Stufe</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">{result.stufe}/{10}</p>
                    <p className="text-xs text-gray-500 mt-1">{result.stufe_beschreibung}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aufteilung */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-blue-50">
                <CardTitle>Kostenaufteilung nach CO2KostAufG</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">Vermieter zahlt</h3>
                      <span className="text-3xl font-bold text-red-600">{result.vermieter_anteil_prozent}%</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">€{result.vermieter_anteil_euro}</p>
                    <p className="text-sm text-red-600 mt-2">Von {result.co2_kosten_gesamt} € Gesamtkosten</p>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">Mieter zahlt</h3>
                      <span className="text-3xl font-bold text-blue-600">{result.mieter_anteil_prozent}%</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">€{result.mieter_anteil_euro}</p>
                    <p className="text-sm text-blue-600 mt-2">Von {result.co2_kosten_gesamt} € Gesamtkosten</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.hinweis && (
              <Card className="border-l-4 border-yellow-500">
                <CardContent className="pt-6">
                  <p className="text-yellow-800">{result.hinweis}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}