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

export default function SteuersparungsRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    brutto_mieteinnahmen: '',
    betriebskosten: '',
    reparaturen: '',
    zinskosten: '',
    abschreibung: '',
    versicherung: '',
    steuerlich_einkommen: '',
    einkommensteuersatz: ''
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
    const brutto = parseFloat(input.brutto_mieteinnahmen) || 0;
    const betriebskosten = parseFloat(input.betriebskosten) || 0;
    const reparaturen = parseFloat(input.reparaturen) || 0;
    const zinskosten = parseFloat(input.zinskosten) || 0;
    const abschreibung = parseFloat(input.abschreibung) || 0;
    const versicherung = parseFloat(input.versicherung) || 0;
    const steuersatz = parseFloat(input.einkommensteuersatz) || 42;

    if (!brutto) {
      toast.error('Brutto Mieteinnahmen erforderlich');
      return;
    }

    // Werbungskosten
    const werbungskosten = betriebskosten + reparaturen + zinskosten + versicherung;

    // Einkünfte aus Vermietung
    const einkuenfte_vermieten = brutto - werbungskosten - abschreibung;

    // Steuer ohne Abschreibung
    const steuerbasis_ohne_abschreibung = brutto - (werbungskosten - abschreibung);
    const steuer_ohne_abschreibung = steuerbasis_ohne_abschreibung * (steuersatz / 100);

    // Steuer mit Abschreibung
    const steuer_mit_abschreibung = einkuenfte_vermieten * (steuersatz / 100);

    // Steuerersparnis durch Abschreibung
    const steuerersparnis = steuer_ohne_abschreibung - steuer_mit_abschreibung;

    // Effektive Rendite nach Steuern
    const netto_mieteinnahmen = brutto - werbungskosten - steuer_mit_abschreibung;

    setResult({
      brutto_einnahmen: brutto.toFixed(2),
      werbungskosten: werbungskosten.toFixed(2),
      einkuenfte_vermieten: einkuenfte_vermieten.toFixed(2),
      steuer_ohne_abschreibung: steuer_ohne_abschreibung.toFixed(2),
      steuer_mit_abschreibung: steuer_mit_abschreibung.toFixed(2),
      steuerersparnis: steuerersparnis.toFixed(2),
      netto_mieteinnahmen: netto_mieteinnahmen.toFixed(2),
      steuersatz_angewendet: steuersatz.toFixed(1)
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
        tool_name: 'Steuersparungsrechner',
        tool_id: 'steuersparung_rechner',
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
            🎯 Steuersparungsrechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie Steuereinsparungen durch Werbungskosten und Abschreibung bei Vermietung
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Mieteinnahmen" collapsible={false}>
              <div className="space-y-4">
                <div>
                  <Label>Brutto Mieteinnahmen pro Jahr (€) *</Label>
                  <Input
                    type="number"
                    value={input.brutto_mieteinnahmen}
                    onChange={(e) => updateInput('brutto_mieteinnahmen', e.target.value)}
                    placeholder="12000"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Abzugsfähige Werbungskosten:</strong>
                  </p>
                </div>
              </div>
            </FormSection>

            <FormSection title="Werbungskosten" collapsible={false} className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label>Betriebskosten (Nebenkosten) €/Jahr</Label>
                  <Input
                    type="number"
                    value={input.betriebskosten}
                    onChange={(e) => updateInput('betriebskosten', e.target.value)}
                    placeholder="2000"
                  />
                </div>

                <div>
                  <Label>Reparaturen & Instandhaltung €/Jahr</Label>
                  <Input
                    type="number"
                    value={input.reparaturen}
                    onChange={(e) => updateInput('reparaturen', e.target.value)}
                    placeholder="800"
                  />
                </div>

                <div>
                  <Label>Zinskosten (Darlehenszinsen) €/Jahr</Label>
                  <Input
                    type="number"
                    value={input.zinskosten}
                    onChange={(e) => updateInput('zinskosten', e.target.value)}
                    placeholder="3500"
                  />
                </div>

                <div>
                  <Label>Versicherungen €/Jahr</Label>
                  <Input
                    type="number"
                    value={input.versicherung}
                    onChange={(e) => updateInput('versicherung', e.target.value)}
                    placeholder="500"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Abschreibung & Steuersatz" collapsible={false} className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label>Abschreibung (Afschreibung) €/Jahr</Label>
                  <Input
                    type="number"
                    value={input.abschreibung}
                    onChange={(e) => updateInput('abschreibung', e.target.value)}
                    placeholder="2000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Typisch: ca. 2-3% des Kaufpreises pro Jahr
                  </p>
                </div>

                <div>
                  <Label>Persönlicher Einkommensteuersatz (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={input.einkommensteuersatz}
                    onChange={(e) => updateInput('einkommensteuersatz', e.target.value)}
                    placeholder="42"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Individuelle Steuerlast inkl. Solidaritätszuschlag
                  </p>
                </div>
              </div>
            </FormSection>

            <Button
              onClick={calculate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Berechnen
            </Button>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Steuersparnis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Brutto Einnahmen</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.brutto_einnahmen).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Werbungskosten</p>
                        <p className="text-lg font-bold text-gray-900">
                          -{parseFloat(result.werbungskosten).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-red-200">
                        <p className="text-xs text-gray-600 mb-1">Steuerzahlung ohne Abschreibung</p>
                        <p className="text-lg font-bold text-red-600">
                          {parseFloat(result.steuer_ohne_abschreibung).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-red-200">
                        <p className="text-xs text-gray-600 mb-1">Steuerzahlung mit Abschreibung</p>
                        <p className="text-lg font-bold text-red-600">
                          {parseFloat(result.steuer_mit_abschreibung).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-green-100 rounded p-3 border border-green-300 mt-2">
                        <p className="text-xs text-gray-600 mb-1">💡 Jährliche Steuersparnis</p>
                        <p className="text-2xl font-bold text-green-600">
                          {parseFloat(result.steuerersparnis).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Netto Mieteinnahmen</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.netto_mieteinnahmen).toLocaleString('de-DE')}€
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