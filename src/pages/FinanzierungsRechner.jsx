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

export default function FinanzierungsRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    kaufpreis: '',
    eigenkapital: '',
    zinssatz: '',
    laufzeit_jahre: ''
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
    const kaufpreis = parseFloat(input.kaufpreis) || 0;
    const eigenkapital = parseFloat(input.eigenkapital) || 0;
    const zinssatz = parseFloat(input.zinssatz) || 0;
    const laufzeit_jahre = parseFloat(input.laufzeit_jahre) || 0;

    if (!kaufpreis || !laufzeit_jahre) {
      toast.error('Kaufpreis und Laufzeit erforderlich');
      return;
    }

    const fremdkapital = kaufpreis - eigenkapital;
    if (fremdkapital <= 0) {
      toast.error('Fremdkapital muss größer als 0 sein');
      return;
    }

    // Annuitätenrechnung
    const p = zinssatz / 100;
    const n = laufzeit_jahre * 12;
    const i_monatlich = p / 12;

    // Monatliche Rate
    const monatliche_rate = fremdkapital * 
      (i_monatlich * Math.pow(1 + i_monatlich, n)) / 
      (Math.pow(1 + i_monatlich, n) - 1);

    const gesamtrate = monatliche_rate * n;
    const gesamtzinsen = gesamtrate - fremdkapital;
    const eigenkapital_prozent = (eigenkapital / kaufpreis) * 100;

    setResult({
      fremdkapital: fremdkapital.toFixed(2),
      monatliche_rate: monatliche_rate.toFixed(2),
      gesamtrate: gesamtrate.toFixed(2),
      gesamtzinsen: gesamtzinsen.toFixed(2),
      eigenkapital_prozent: eigenkapital_prozent.toFixed(2)
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
      if (!user?.email) {
        toast.error('Benutzerdaten fehlen');
        return;
      }

      await base44.entities.SavedCalculation?.create?.({
        user_email: user.email,
        calculator_type: 'Finanzierungsrechner',
        inputs: input,
        results: result,
        name: savedName
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
            🏦 Finanzierungsrechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie monatliche Raten und Gesamtkosten für Ihre Immobilienfinanzierung
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Eingaben" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Annuitätendarlehen:</strong> Gleichbleibende monatliche Raten mit fallenden Zinsanteilen
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Kaufpreis (€) *</Label>
                    <Input
                      type="number"
                      value={input.kaufpreis}
                      onChange={(e) => updateInput('kaufpreis', e.target.value)}
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <Label>Eigenkapital (€) *</Label>
                    <Input
                      type="number"
                      value={input.eigenkapital}
                      onChange={(e) => updateInput('eigenkapital', e.target.value)}
                      placeholder="150000"
                    />
                  </div>
                </div>

                <div>
                  <Label>Darlehensbetrag (€)</Label>
                  <div className="bg-gray-100 rounded p-3 font-semibold text-gray-900">
                    {input.kaufpreis && input.eigenkapital
                      ? (parseFloat(input.kaufpreis) - parseFloat(input.eigenkapital)).toLocaleString('de-DE') + '€'
                      : '–'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Zinssatz (%) p.a. *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={input.zinssatz}
                      onChange={(e) => updateInput('zinssatz', e.target.value)}
                      placeholder="3.5"
                    />
                  </div>
                  <div>
                    <Label>Laufzeit (Jahre) *</Label>
                    <Input
                      type="number"
                      value={input.laufzeit_jahre}
                      onChange={(e) => updateInput('laufzeit_jahre', e.target.value)}
                      placeholder="20"
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
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Finanzierungsplan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Darlehensbetrag</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.fremdkapital).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-purple-300">
                        <p className="text-xs text-gray-600 mb-1">Monatliche Rate</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {parseFloat(result.monatliche_rate).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Gesamtbelastung ({input.laufzeit_jahre} Jahre)</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.gesamtrate).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-red-50 rounded p-3 border border-red-200">
                        <p className="text-xs text-gray-600 mb-1">Gesamtzinsen</p>
                        <p className="text-lg font-bold text-red-600">
                          {parseFloat(result.gesamtzinsen).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Eigenkapitalquote</p>
                        <p className="text-lg font-bold text-green-600">
                          {result.eigenkapital_prozent}%
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