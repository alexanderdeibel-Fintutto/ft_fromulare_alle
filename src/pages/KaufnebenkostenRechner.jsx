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

export default function KaufnebenkostenRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    kaufpreis: '',
    bundesland: 'berlin', // DE bundesland codes
    hat_makler: false,
    makler_provision: '3',
    grundbucher_eintrag: '0.2'
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

  // Grunderwerbsteuer nach Bundesland
  const grunderwerbsteuer_saetze = {
    'baden-wuerttemberg': 5.0,
    'bayern': 3.5,
    'berlin': 6.0,
    'brandenburg': 5.0,
    'bremen': 5.0,
    'hamburg': 4.5,
    'hessen': 7.0,
    'mecklenburg-vorpommern': 5.0,
    'niedersachsen': 5.0,
    'nordrhein-westfalen': 6.5,
    'rheinland-pfalz': 5.0,
    'saarland': 6.5,
    'sachsen': 3.5,
    'sachsen-anhalt': 5.0,
    'schleswig-holstein': 6.5,
    'thueringen': 6.5
  };

  const calculate = () => {
    const kaufpreis = parseFloat(input.kaufpreis);
    if (!kaufpreis) {
      toast.error('Kaufpreis erforderlich');
      return;
    }

    const gest = grunderwerbsteuer_saetze[input.bundesland] || 6.0;
    const grunderwerbsteuer = kaufpreis * (gest / 100);

    // Makler (optional, bei Verkauf üblicherweise 50/50 Provision)
    const makler_kosten = input.hat_makler 
      ? kaufpreis * (parseFloat(input.makler_provision) / 100)
      : 0;

    // Notargebühren (ca. 0,8-1% vom Kaufpreis + Grundbucher)
    const notargebuehren = kaufpreis * 0.01;
    const grundbucher = kaufpreis * (parseFloat(input.grundbucher_eintrag) / 100);

    const nebenkosten_gesamt = grunderwerbsteuer + makler_kosten + notargebuehren + grundbucher;
    const gesamtkosten = kaufpreis + nebenkosten_gesamt;
    const nebenkosten_prozent = (nebenkosten_gesamt / kaufpreis) * 100;

    setResult({
      grunderwerbsteuer: grunderwerbsteuer.toFixed(2),
      gest_prozent: gest.toFixed(1),
      makler_kosten: makler_kosten.toFixed(2),
      notargebuehren: notargebuehren.toFixed(2),
      grundbucher: grundbucher.toFixed(2),
      nebenkosten_gesamt: nebenkosten_gesamt.toFixed(2),
      gesamtkosten: gesamtkosten.toFixed(2),
      nebenkosten_prozent: nebenkosten_prozent.toFixed(2)
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
        tool_name: 'Kaufnebenkostenrechner',
        tool_id: 'kaufnebenkosten_rechner',
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

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💰 Kaufnebenkostenrechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie Grunderwerbsteuer, Makler, Notar und Grundbuchgebühren
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Eingaben" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Faustregel:</strong> Kaufnebenkosten liegen meist bei 8-15% des Kaufpreises
                  </p>
                </div>

                <div>
                  <Label>Kaufpreis (€) *</Label>
                  <Input
                    type="number"
                    value={input.kaufpreis}
                    onChange={(e) => updateInput('kaufpreis', e.target.value)}
                    placeholder="350000"
                  />
                </div>

                <div>
                  <Label>Bundesland *</Label>
                  <select
                    value={input.bundesland}
                    onChange={(e) => updateInput('bundesland', e.target.value)}
                    className="w-full rounded border p-2"
                  >
                    {Object.entries(grunderwerbsteuer_saetze).map(([key, rate]) => (
                      <option key={key} value={key}>
                        {key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ({rate}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.hat_makler}
                      onChange={(e) => updateInput('hat_makler', e.target.checked)}
                    />
                    <span className="text-sm font-medium">Mit Makler</span>
                  </label>
                </div>

                {input.hat_makler && (
                  <div>
                    <Label>Maklerprovision (%) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={input.makler_provision}
                      onChange={(e) => updateInput('makler_provision', e.target.value)}
                      placeholder="3"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Notargebühren (%)</Label>
                    <div className="bg-gray-100 rounded p-2 text-sm font-semibold">ca. 1%</div>
                  </div>
                  <div>
                    <Label className="text-xs">Grundbuch (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={input.grundbucher_eintrag}
                      onChange={(e) => updateInput('grundbucher_eintrag', e.target.value)}
                      placeholder="0.2"
                    />
                  </div>
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
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Kostenaufstellung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Grunderwerbsteuer ({result.gest_prozent}%)</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.grunderwerbsteuer).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      {parseFloat(result.makler_kosten) > 0 && (
                        <div className="bg-white rounded p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Maklerprovision</p>
                          <p className="text-lg font-bold text-gray-900">
                            {parseFloat(result.makler_kosten).toLocaleString('de-DE')}€
                          </p>
                        </div>
                      )}

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Notargebühren</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.notargebuehren).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Grundbuch Eintrag</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.grundbucher).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-amber-300 mt-2">
                        <p className="text-xs text-gray-600 mb-1">Nebenkosten gesamt</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {parseFloat(result.nebenkosten_gesamt).toLocaleString('de-DE')}€
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({result.nebenkosten_prozent}% vom Kaufpreis)
                        </p>
                      </div>

                      <div className="bg-amber-100 rounded p-3 border border-amber-300">
                        <p className="text-xs text-gray-600 mb-1">Gesamtkosten (Kaufpreis + Nebenkosten)</p>
                        <p className="text-xl font-bold text-amber-900">
                          {parseFloat(result.gesamtkosten).toLocaleString('de-DE')}€
                        </p>
                      </div>
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