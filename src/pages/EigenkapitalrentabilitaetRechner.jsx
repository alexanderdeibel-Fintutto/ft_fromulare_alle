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

export default function EigenkapitalrentabilitaetRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    eigenkapital: '',
    jahresgewinn: '',
    kaufpreis: '',
    wertentwicklung_prozent: '2'
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
    const ek = parseFloat(input.eigenkapital);
    const gewinn = parseFloat(input.jahresgewinn);
    const kaufpreis = parseFloat(input.kaufpreis);
    const wertsteigerung = parseFloat(input.wertentwicklung_prozent);

    if (!ek || !gewinn) {
      toast.error('Eigenkapital und Jahresgewinn erforderlich');
      return;
    }

    // Eigenkapitalrentabilität (reine Gewinn-Rendite)
    const ekr = (gewinn / ek) * 100;

    // Mit Wertsteigerung
    const wertzuwachs = kaufpreis ? (kaufpreis * (wertsteigerung / 100)) : 0;
    const gesamtertrag = gewinn + wertzuwachs;
    const ekr_mit_wert = (gesamtertrag / ek) * 100;

    // Gesamtkapitalrendite (wenn Finanzierung bekannt)
    const finanzierungsgrad = kaufpreis ? ((kaufpreis - ek) / kaufpreis * 100) : 0;
    const gesamtkapitalrendite = kaufpreis ? ((gewinn / kaufpreis) * 100) : 0;

    // Leverage-Effekt
    const hebelwirkung = ekr_mit_wert - gesamtkapitalrendite;

    setResult({
      ekr: ekr.toFixed(2),
      ekr_mit_wert: ekr_mit_wert.toFixed(2),
      gesamtkapitalrendite: gesamtkapitalrendite.toFixed(2),
      hebelwirkung: hebelwirkung.toFixed(2),
      wertzuwachs: wertzuwachs.toFixed(2),
      gesamtertrag: gesamtertrag.toFixed(2),
      finanzierungsgrad: finanzierungsgrad.toFixed(1)
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
        tool_name: 'Eigenkapitalrentabilität',
        tool_id: 'eigenkapitalrente_rechner',
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
            📊 Eigenkapitalrentabilität (EKR)
          </h1>
          <p className="text-gray-600">
            Berechnen Sie die Rentabilität Ihres eingesetzten Eigenkapitals inklusive Hebeleffekt
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Kapitalstruktur" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>EKR zeigt:</strong> Gewinn im Verhältnis zum eingesetzten Eigenkapital
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Eingesetztes Eigenkapital (€) *</Label>
                    <Input
                      type="number"
                      value={input.eigenkapital}
                      onChange={(e) => updateInput('eigenkapital', e.target.value)}
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <Label>Kaufpreis / Immobilienwert (€)</Label>
                    <Input
                      type="number"
                      value={input.kaufpreis}
                      onChange={(e) => updateInput('kaufpreis', e.target.value)}
                      placeholder="400000"
                    />
                  </div>
                </div>

                <div>
                  <Label>Jahresgewinn / Jahresüberschuss (€) *</Label>
                  <Input
                    type="number"
                    value={input.jahresgewinn}
                    onChange={(e) => updateInput('jahresgewinn', e.target.value)}
                    placeholder="15000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Netto-Cashflow nach alle Kosten und Steuern
                  </p>
                </div>

                <div>
                  <Label>Erwartete jährliche Wertsteigerung (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={input.wertentwicklung_prozent}
                    onChange={(e) => updateInput('wertentwicklung_prozent', e.target.value)}
                    placeholder="2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Konservativ 1-3% bei guter Lage
                  </p>
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
                    <CardTitle className="text-lg">Rentabilität</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-green-300">
                        <p className="text-xs text-gray-600 mb-1">EKR (reine Mietrendite)</p>
                        <p className="text-2xl font-bold text-green-600">
                          {result.ekr}%
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-blue-300">
                        <p className="text-xs text-gray-600 mb-1">EKR mit Wertsteigerung</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {result.ekr_mit_wert}%
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Gesamtkapitalrendite</p>
                        <p className="text-lg font-bold text-gray-900">
                          {result.gesamtkapitalrendite}%
                        </p>
                      </div>

                      <div className="bg-purple-50 rounded p-3 border border-purple-300 mt-2">
                        <p className="text-xs text-gray-600 mb-1">💡 Hebelwirkung</p>
                        <p className="text-lg font-bold text-purple-600">
                          +{result.hebelwirkung}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Vorteil durch Fremdkapital
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {parseFloat(result.finanzierungsgrad) > 0 && (
                  <Card className="border-2 border-amber-200 bg-amber-50 mb-4">
                    <CardHeader>
                      <CardTitle className="text-sm">Finanzierungsstruktur</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Finanzierungsgrad:</span>
                          <span className="font-bold">{result.finanzierungsgrad}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jahrerertrag:</span>
                          <span className="font-bold">{parseFloat(result.gesamtertrag).toLocaleString('de-DE')}€</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

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