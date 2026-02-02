import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Calculator, Save } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function MietausfallRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    monatsmiete: '',
    anzahl_einheiten: '1',
    mietausfallquote: '5', // in %
    betrachtungszeitraum: '12' // Monate
  });

  const [result, setResult] = useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const updateInput = (field, value) => {
    setInput(prev => ({ ...prev, [field]: value }));
    setResult(null);
  };

  const calculate = () => {
    const miete = parseFloat(input.monatsmiete);
    const einheiten = parseInt(input.anzahl_einheiten);
    const quote = parseFloat(input.mietausfallquote);
    const zeitraum = parseInt(input.betrachtungszeitraum);

    if (!miete || !einheiten || !zeitraum) {
      toast.error('Miete, Einheiten und Zeitraum erforderlich');
      return;
    }

    // Brutto-Mietpotential
    const monatlich_brutto = miete * einheiten;
    const zeitraum_brutto = monatlich_brutto * zeitraum;

    // Mit Mietausfallwagnis
    const mietausfallquote_dez = quote / 100;
    const monatlich_netto = monatlich_brutto * (1 - mietausfallquote_dez);
    const zeitraum_netto = monatlich_netto * zeitraum;

    // Wegfall durch Mietausfallwagnis
    const monatlich_ausfall = monatlich_brutto * mietausfallquote_dez;
    const zeitraum_ausfall = zeitraum_brutto - zeitraum_netto;

    // Annahmen für verschiedene Szenarien
    const szenarien = [
      { name: 'Best Case (2% Ausfallquote)', quote: 0.02 },
      { name: 'Normal (5% Ausfallquote)', quote: 0.05 },
      { name: 'Konservativ (8% Ausfallquote)', quote: 0.08 },
      { name: 'Pessimistisch (12% Ausfallquote)', quote: 0.12 }
    ];

    const szenarien_ergebnisse = szenarien.map(szenario => ({
      name: szenario.name,
      ausfall_prozent: (szenario.quote * 100).toFixed(1),
      netto_zeitraum: (zeitraum_brutto * (1 - szenario.quote)).toFixed(2),
      ausfall_betrag: (zeitraum_brutto * szenario.quote).toFixed(2)
    }));

    setResult({
      monatlich_brutto: monatlich_brutto.toFixed(2),
      zeitraum_brutto: zeitraum_brutto.toFixed(2),
      monatlich_netto: monatlich_netto.toFixed(2),
      zeitraum_netto: zeitraum_netto.toFixed(2),
      monatlich_ausfall: monatlich_ausfall.toFixed(2),
      zeitraum_ausfall: zeitraum_ausfall.toFixed(2),
      angewandte_quote: quote.toFixed(1),
      zeitraum,
      szenarien: szenarien_ergebnisse
    });
  };

  const saveCalculation = async () => {
    if (!result) {
      toast.error('Bitte zuerst berechnen');
      return;
    }
    if (!savedName.trim()) {
      toast.error('Bitte einen Namen eingeben');
      return;
    }

    setSaveLoading(true);
    try {
      await base44.entities.SavedCalculation.create({
        user_email: user.email,
        tool_name: 'Mietausfallrechner',
        tool_id: 'mietausfall_rechner',
        calculation_data: input,
        result_data: result,
        name: savedName,
        is_favorite: false
      });

      toast.success('Berechnung gespeichert!');
      setSavedName('');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚠️ Mietausfallrechner
          </h1>
          <p className="text-gray-600">
            Kalkulieren Sie realistische Mietausfallwagnisse und Leerstandsrisiken
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Eingaben" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Mietausfallwagnis:</strong> Risikopuffer für Leerstand und Zahlungsausfälle
                  </p>
                </div>

                <div>
                  <Label>Monatsmiete pro Einheit (€) *</Label>
                  <Input
                    type="number"
                    value={input.monatsmiete}
                    onChange={(e) => updateInput('monatsmiete', e.target.value)}
                    placeholder="1200"
                  />
                </div>

                <div>
                  <Label>Anzahl Wohneinheiten *</Label>
                  <Input
                    type="number"
                    value={input.anzahl_einheiten}
                    onChange={(e) => updateInput('anzahl_einheiten', e.target.value)}
                    placeholder="3"
                  />
                </div>

                <div>
                  <Label>Mietausfallquote (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={input.mietausfallquote}
                    onChange={(e) => updateInput('mietausfallquote', e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Typisch 3-8% je nach Lage und Objektqualität
                  </p>
                </div>

                <div>
                  <Label>Betrachtungszeitraum (Monate)</Label>
                  <Input
                    type="number"
                    value={input.betrachtungszeitraum}
                    onChange={(e) => updateInput('betrachtungszeitraum', e.target.value)}
                    placeholder="12"
                  />
                </div>

                <Button
                  onClick={calculate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Berechnen
                </Button>
              </div>
            </FormSection>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Mietausfallanalyse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Brutto-Potential ({result.zeitraum} Monate)</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.zeitraum_brutto).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-red-300">
                        <p className="text-xs text-gray-600 mb-1">Mietausfallwagnis ({result.angewandte_quote}%)</p>
                        <p className="text-2xl font-bold text-red-600">
                          -{parseFloat(result.zeitraum_ausfall).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-green-300">
                        <p className="text-xs text-gray-600 mb-1">Netto-Ertrag ({result.zeitraum} Monate)</p>
                        <p className="text-lg font-bold text-green-600">
                          {parseFloat(result.zeitraum_netto).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Monatlich Netto</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.monatlich_netto).toLocaleString('de-DE')}€
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 bg-blue-50 mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Szenarien</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      {result.szenarien.map((szenario, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-blue-200">
                          <p className="font-semibold text-gray-900">{szenario.name}</p>
                          <p className="text-gray-600 mt-1">
                            Netto: {parseFloat(szenario.netto_zeitraum).toLocaleString('de-DE')}€
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-4 space-y-2">
                  <Input
                    placeholder="Berechnung benennen..."
                    value={savedName}
                    onChange={(e) => setSavedName(e.target.value)}
                  />
                  <Button
                    onClick={saveCalculation}
                    disabled={saveLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}