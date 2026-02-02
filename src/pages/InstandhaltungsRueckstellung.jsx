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

export default function InstandhaltungsRueckstellung() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    kaufpreis: '',
    alter_gebaeude: '',
    instandhaltungsgruppe: '1', // 1-4 nach GdW
    prognose_jahre: '20'
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
    const kaufpreis = parseFloat(input.kaufpreis);
    const alter = parseInt(input.alter_gebaeude);
    const gruppe = parseInt(input.instandhaltungsgruppe);
    const prognose = parseInt(input.prognose_jahre);

    if (!kaufpreis || !alter || isNaN(prognose)) {
      toast.error('Kaufpreis, Alter und Prognose erforderlich');
      return;
    }

    // GdW Instandhaltungsquoten (% des Kaufpreises pro Jahr)
    const quoten = {
      1: 0.8,  // Neubauten bis 6 Jahre
      2: 1.2,  // 7-20 Jahre
      3: 1.6,  // 21-40 Jahre
      4: 2.0   // älter als 40 Jahre
    };

    const quote = quoten[gruppe] || 1.2;
    const jaehrliche_rueckstellung = kaufpreis * (quote / 100);
    const rueckstellung_prognose = jaehrliche_rueckstellung * prognose;

    // Durchschnittlich jährliche Kosten
    const durchschnitt_pro_jahr = jaehrliche_rueckstellung;

    // Schwellenwerte für Große Reparaturen
    const grosse_reparatur_schwelle = kaufpreis * 0.05;

    setResult({
      instandhaltungsquote: quote.toFixed(2),
      jaehrliche_rueckstellung: jaehrliche_rueckstellung.toFixed(2),
      rueckstellung_prognose: rueckstellung_prognose.toFixed(2),
      durchschnitt_pro_monat: (jaehrliche_rueckstellung / 12).toFixed(2),
      grosse_reparatur_schwelle: grosse_reparatur_schwelle.toFixed(2),
      prognose_jahre: prognose
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
        tool_name: 'Instandhaltungsrückstellung',
        tool_id: 'instandhaltung_rueckstellung',
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
            🏗️ Instandhaltungsrückstellung
          </h1>
          <p className="text-gray-600">
            Planen Sie realistische Rückstellungen für künftige Instandhaltungsarbeiten
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Gebäudedaten" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>GdW Standard:</strong> Instandhaltungsquoten nach Gebäudealter und -zustand
                  </p>
                </div>

                <div>
                  <Label>Kaufpreis / Marktwert (€) *</Label>
                  <Input
                    type="number"
                    value={input.kaufpreis}
                    onChange={(e) => updateInput('kaufpreis', e.target.value)}
                    placeholder="450000"
                  />
                </div>

                <div>
                  <Label>Alter des Gebäudes (Jahre) *</Label>
                  <Input
                    type="number"
                    value={input.alter_gebaeude}
                    onChange={(e) => updateInput('alter_gebaeude', e.target.value)}
                    placeholder="15"
                  />
                </div>

                <div>
                  <Label>Instandhaltungsgruppe *</Label>
                  <select
                    value={input.instandhaltungsgruppe}
                    onChange={(e) => updateInput('instandhaltungsgruppe', e.target.value)}
                    className="w-full rounded border p-2"
                  >
                    <option value="1">Gruppe 1: Neubauten bis 6 Jahre (0,8%)</option>
                    <option value="2">Gruppe 2: 7-20 Jahre (1,2%)</option>
                    <option value="3">Gruppe 3: 21-40 Jahre (1,6%)</option>
                    <option value="4">Gruppe 4: Älter als 40 Jahre (2,0%)</option>
                  </select>
                </div>

                <div>
                  <Label>Prognose-Zeitraum (Jahre)</Label>
                  <Input
                    type="number"
                    value={input.prognose_jahre}
                    onChange={(e) => updateInput('prognose_jahre', e.target.value)}
                    placeholder="20"
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

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Hinweis:</strong> Diese Rückstellung sollte regelmäßig angepasst werden und dient als Orientierungswert. Lassen Sie sich ggfs. von einem Sachverständigen beraten.
              </p>
            </div>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Rückstellungsplan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Instandhaltungsquote</p>
                        <p className="text-lg font-bold text-gray-900">
                          {result.instandhaltungsquote}% p.a.
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-amber-300">
                        <p className="text-xs text-gray-600 mb-1">Jährliche Rückstellung</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {parseFloat(result.jaehrliche_rueckstellung).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Monatliche Rückstellung</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.durchschnitt_pro_monat).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Rückstellung in {result.prognose_jahre} Jahren</p>
                        <p className="text-xl font-bold text-blue-600">
                          {parseFloat(result.rueckstellung_prognose).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-yellow-50 rounded p-3 border border-yellow-200 mt-2">
                        <p className="text-xs text-gray-600 mb-1">Große Reparaturen (Schwelle)</p>
                        <p className="text-sm font-bold text-yellow-800">
                          ab {parseFloat(result.grosse_reparatur_schwelle).toLocaleString('de-DE')}€
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