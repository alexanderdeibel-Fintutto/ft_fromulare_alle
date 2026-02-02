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

export default function VerkaufserlösRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    verkaufspreis: '',
    maklergebueher_prozent: '3',
    notarkosten_prozent: '1.5',
    grunderwerbsteuer_prozent: '5',
    courtage_prozent: '0',
    kuenftige_reparaturen: '0',
    ausstehende_mieten: '0',
    haftungen: '0'
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
    const verkauf = parseFloat(input.verkaufspreis);
    const makler = parseFloat(input.maklergebueher_prozent) / 100;
    const notar = parseFloat(input.notarkosten_prozent) / 100;
    const grunderwerbsteuer = parseFloat(input.grunderwerbsteuer_prozent) / 100;
    const courtage = parseFloat(input.courtage_prozent) / 100;
    const reparaturen = parseFloat(input.kuenftige_reparaturen) || 0;
    const mieten = parseFloat(input.ausstehende_mieten) || 0;
    const haftungen = parseFloat(input.haftungen) || 0;

    if (!verkauf) {
      toast.error('Verkaufspreis erforderlich');
      return;
    }

    // Kosten berechnen
    const makler_kosten = verkauf * makler;
    const notar_kosten = verkauf * notar;
    const grunderwerbsteuer_kosten = verkauf * grunderwerbsteuer;
    const courtage_kosten = verkauf * courtage;
    const summe_kosten = makler_kosten + notar_kosten + grunderwerbsteuer_kosten + courtage_kosten;

    // Gesamtausgaben
    const gesamtausgaben = summe_kosten + reparaturen + haftungen;

    // Netto-Erlös
    const netto_erlös = verkauf + mieten - gesamtausgaben;
    const quote = (gesamtausgaben / verkauf * 100).toFixed(2);

    setResult({
      verkaufspreis: verkauf.toFixed(2),
      makler_kosten: makler_kosten.toFixed(2),
      notar_kosten: notar_kosten.toFixed(2),
      grunderwerbsteuer_kosten: grunderwerbsteuer_kosten.toFixed(2),
      courtage_kosten: courtage_kosten.toFixed(2),
      summe_gebühren: summe_kosten.toFixed(2),
      reparaturen,
      haftungen,
      mieten,
      gesamtausgaben: gesamtausgaben.toFixed(2),
      netto_erlös: netto_erlös.toFixed(2),
      kostenquote: quote
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
        tool_name: 'Verkaufserlös-Rechner',
        tool_id: 'verkaufserloes_rechner',
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
            💰 Verkaufserlös-Rechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie den Netto-Verkaufserlös nach allen Kosten und Gebühren
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Verkaufspreis & Gebühren" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Wichtig:</strong> Alle Kosten werden vom Verkaufserlös abgezogen
                  </p>
                </div>

                <div>
                  <Label>Verkaufspreis (€) *</Label>
                  <Input
                    type="number"
                    value={input.verkaufspreis}
                    onChange={(e) => updateInput('verkaufspreis', e.target.value)}
                    placeholder="500000"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Gebühren & Steuern</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Maklergebühr (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={input.maklergebueher_prozent}
                        onChange={(e) => updateInput('maklergebueher_prozent', e.target.value)}
                        placeholder="3"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Notarkosten (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={input.notarkosten_prozent}
                        onChange={(e) => updateInput('notarkosten_prozent', e.target.value)}
                        placeholder="1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Grunderwerbsteuer (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={input.grunderwerbsteuer_prozent}
                        onChange={(e) => updateInput('grunderwerbsteuer_prozent', e.target.value)}
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Je nach Bundesland unterschiedlich (3,5% - 6,5%)
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm">Courtage (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={input.courtage_prozent}
                        onChange={(e) => updateInput('courtage_prozent', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-3">Weitere Abzüge</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Künftige Reparaturen (€)</Label>
                      <Input
                        type="number"
                        value={input.kuenftige_reparaturen}
                        onChange={(e) => updateInput('kuenftige_reparaturen', e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Ausstehende Mieten (€)</Label>
                      <Input
                        type="number"
                        value={input.ausstehende_mieten}
                        onChange={(e) => updateInput('ausstehende_mieten', e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Haftungen / Umweltkosten (€)</Label>
                      <Input
                        type="number"
                        value={input.haftungen}
                        onChange={(e) => updateInput('haftungen', e.target.value)}
                        placeholder="0"
                      />
                    </div>
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
                <Card className="border-2 border-green-200 bg-green-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Netto-Erlös</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center bg-white rounded p-4 border border-green-300">
                      <p className="text-xs text-gray-600 mb-1">Auszahlung nach Kosten</p>
                      <p className="text-3xl font-bold text-green-600">
                        {parseFloat(result.netto_erlös).toLocaleString('de-DE')}€
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-gray-200 text-xs">
                      <p className="text-gray-600 mb-1">Verkaufspreis</p>
                      <p className="font-bold text-gray-900">
                        {parseFloat(result.verkaufspreis).toLocaleString('de-DE')}€
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-red-200 text-xs">
                      <p className="text-gray-600 mb-1">Kosten & Gebühren</p>
                      <p className="font-bold text-red-600">
                        -{parseFloat(result.gesamtausgaben).toLocaleString('de-DE')}€
                      </p>
                      <p className="text-gray-500 mt-1">({result.kostenquote}%)</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Kostenaufschlüsselung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-gray-700">Maklergebühr</span>
                      <span className="font-bold">{parseFloat(result.makler_kosten).toLocaleString('de-DE')}€</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-gray-700">Notarkosten</span>
                      <span className="font-bold">{parseFloat(result.notar_kosten).toLocaleString('de-DE')}€</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-gray-700">Grunderwerbsteuer</span>
                      <span className="font-bold">{parseFloat(result.grunderwerbsteuer_kosten).toLocaleString('de-DE')}€</span>
                    </div>
                    {parseFloat(result.courtage_kosten) > 0 && (
                      <div className="flex justify-between pb-2 border-b">
                        <span className="text-gray-700">Courtage</span>
                        <span className="font-bold">{parseFloat(result.courtage_kosten).toLocaleString('de-DE')}€</span>
                      </div>
                    )}
                    {parseFloat(result.reparaturen) > 0 && (
                      <div className="flex justify-between pb-2 border-b">
                        <span className="text-gray-700">Reparaturen</span>
                        <span className="font-bold">{parseFloat(result.reparaturen).toLocaleString('de-DE')}€</span>
                      </div>
                    )}
                    {parseFloat(result.haftungen) > 0 && (
                      <div className="flex justify-between pb-2 border-b">
                        <span className="text-gray-700">Haftungen</span>
                        <span className="font-bold">{parseFloat(result.haftungen).toLocaleString('de-DE')}€</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-red-600 bg-red-50 rounded p-2 mt-2">
                      <span>Summe Kosten</span>
                      <span>{parseFloat(result.gesamtausgaben).toLocaleString('de-DE')}€</span>
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