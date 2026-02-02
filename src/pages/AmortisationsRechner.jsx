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

export default function AmortisationsRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    investition: '',
    jaehrlicher_gewinn: '',
    abschreibung: ''
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
    const investition = parseFloat(input.investition);
    const gewinn = parseFloat(input.jaehrlicher_gewinn);
    const abschreibung = parseFloat(input.abschreibung) || 0;

    if (!investition || !gewinn) {
      toast.error('Investition und jährlicher Gewinn erforderlich');
      return;
    }

    if (gewinn <= 0) {
      toast.error('Jährlicher Gewinn muss größer als 0 sein');
      return;
    }

    // Amortisationszeit (einfache Methode)
    const amortisationszeit_jahre = investition / gewinn;
    const amortisationszeit_monate = (amortisationszeit_jahre % 1) * 12;

    // Mit Abschreibung
    const gewinn_mit_abschreibung = gewinn + abschreibung;
    const amortisationszeit_mit_absch = investition / gewinn_mit_abschreibung;
    const amortisationszeit_monate_absch = (amortisationszeit_mit_absch % 1) * 12;

    // Gesamtrendite über 10 und 20 Jahre
    const gewinn_10_jahre = gewinn * 10;
    const gewinn_20_jahre = gewinn * 20;
    const gewinn_30_jahre = gewinn * 30;

    // Mit Abschreibung
    const cashflow_10 = (gewinn + abschreibung) * 10;
    const cashflow_20 = (gewinn + abschreibung) * 20;
    const cashflow_30 = (gewinn + abschreibung) * 30;

    setResult({
      amortisationszeit_jahre: amortisationszeit_jahre.toFixed(1),
      amortisationszeit_monate: Math.round(amortisationszeit_monate),
      amortisationszeit_mit_absch_jahre: amortisationszeit_mit_absch.toFixed(1),
      amortisationszeit_monate_absch: Math.round(amortisationszeit_monate_absch),
      gewinn_10_jahre: gewinn_10_jahre.toFixed(2),
      gewinn_20_jahre: gewinn_20_jahre.toFixed(2),
      gewinn_30_jahre: gewinn_30_jahre.toFixed(2),
      cashflow_10: cashflow_10.toFixed(2),
      cashflow_20: cashflow_20.toFixed(2),
      cashflow_30: cashflow_30.toFixed(2),
      ist_profitabel: gewinn > 0
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
        tool_name: 'Amortisationsrechner',
        tool_id: 'amortisations_rechner',
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
            ⏱️ Amortisationsrechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie, wann sich Ihre Immobilieninvestition amortisiert
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Investition & Rentabilität" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    <strong>Amortisation:</strong> Die Zeit bis eine Investition sich durch Gewinne bezahlt hat
                  </p>
                </div>

                <div>
                  <Label>Investitionssumme (€) *</Label>
                  <Input
                    type="number"
                    value={input.investition}
                    onChange={(e) => updateInput('investition', e.target.value)}
                    placeholder="300000"
                  />
                </div>

                <div>
                  <Label>Jährlicher Gewinn/Cashflow (€) *</Label>
                  <Input
                    type="number"
                    value={input.jaehrlicher_gewinn}
                    onChange={(e) => updateInput('jaehrlicher_gewinn', e.target.value)}
                    placeholder="18000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Netto Mieteinnahmen nach allen Kosten
                  </p>
                </div>

                <div>
                  <Label>Jährliche Abschreibung (€)</Label>
                  <Input
                    type="number"
                    value={input.abschreibung}
                    onChange={(e) => updateInput('abschreibung', e.target.value)}
                    placeholder="3000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Erhöht effektiven Cashflow
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
                <Card className="border-2 border-purple-200 bg-purple-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Amortisationszeit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-purple-300">
                        <p className="text-xs text-gray-600 mb-1">Ohne Abschreibung</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {result.amortisationszeit_jahre} Jahre
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({result.amortisationszeit_monate} Monate)
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-green-300">
                        <p className="text-xs text-gray-600 mb-1">Mit Abschreibung</p>
                        <p className="text-2xl font-bold text-green-600">
                          {result.amortisationszeit_mit_absch_jahre} Jahre
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({result.amortisationszeit_monate_absch} Monate)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Gesamtrendite</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                        <span>Nach 10 Jahren:</span>
                        <span className="font-bold text-gray-900">
                          {parseFloat(result.cashflow_10).toLocaleString('de-DE')}€
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                        <span>Nach 20 Jahren:</span>
                        <span className="font-bold text-gray-900">
                          {parseFloat(result.cashflow_20).toLocaleString('de-DE')}€
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                        <span>Nach 30 Jahren:</span>
                        <span className="font-bold text-gray-900">
                          {parseFloat(result.cashflow_30).toLocaleString('de-DE')}€
                        </span>
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