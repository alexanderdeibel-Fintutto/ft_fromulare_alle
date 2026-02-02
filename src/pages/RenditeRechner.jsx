import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { TrendingUp, Save, Download } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function RenditeRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    kaufpreis: '',
    eigenkapital: '',
    fremdkapital: '',
    zinssatz: '',
    jaehrliche_miete: '',
    nebenkosten: '',
    instandhaltung: '',
    renovierung: '',
    leerstand: ''
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
    const jaehrliche_miete = parseFloat(input.jaehrliche_miete) || 0;
    const nebenkosten = parseFloat(input.nebenkosten) || 0;
    const instandhaltung = parseFloat(input.instandhaltung) || 0;
    const renovierung = parseFloat(input.renovierung) || 0;
    const leerstand = parseFloat(input.leerstand) || 0;
    const zinssatz = parseFloat(input.zinssatz) || 0;
    const fremdkapital = parseFloat(input.fremdkapital) || 0;

    if (!kaufpreis || !jaehrliche_miete) {
      toast.error('Kaufpreis und jährliche Miete erforderlich');
      return;
    }

    // Berechnung
    const brutto_miete = jaehrliche_miete;
    const kosten_summe = nebenkosten + instandhaltung + renovierung;
    const leerstand_verlust = (brutto_miete * leerstand) / 100;
    const netto_miete = brutto_miete - kosten_summe - leerstand_verlust;
    const zinskosten = (fremdkapital * zinssatz) / 100;
    const cashflow = netto_miete - zinskosten;
    const rendite = (netto_miete / kaufpreis) * 100;
    const cashflow_rendite = (cashflow / kaufpreis) * 100;

    setResult({
      brutto_miete: brutto_miete.toFixed(2),
      kosten_summe: kosten_summe.toFixed(2),
      leerstand_verlust: leerstand_verlust.toFixed(2),
      netto_miete: netto_miete.toFixed(2),
      zinskosten: zinskosten.toFixed(2),
      cashflow: cashflow.toFixed(2),
      rendite: rendite.toFixed(2),
      cashflow_rendite: cashflow_rendite.toFixed(2)
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
      const newCalc = await base44.entities.SavedCalculation.create({
        user_email: user.email,
        tool_name: 'Renditerechner',
        tool_id: 'rendite_rechner',
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
            📊 Renditerechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie die Rendite Ihrer Immobilieninvestition
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Eingaben" collapsible={false}>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Kaufpreise</h4>
                  <div className="space-y-2">
                    <div>
                      <Label>Kaufpreis (€) *</Label>
                      <Input
                        type="number"
                        value={input.kaufpreis}
                        onChange={(e) => updateInput('kaufpreis', e.target.value)}
                        placeholder="500000"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Eigenkapital (€)</Label>
                        <Input
                          type="number"
                          value={input.eigenkapital}
                          onChange={(e) => updateInput('eigenkapital', e.target.value)}
                          placeholder="150000"
                        />
                      </div>
                      <div>
                        <Label>Fremdkapital (€)</Label>
                        <Input
                          type="number"
                          value={input.fremdkapital}
                          onChange={(e) => updateInput('fremdkapital', e.target.value)}
                          placeholder="350000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Finanzierung</h4>
                  <div>
                    <Label>Zinssatz (%) p.a.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={input.zinssatz}
                      onChange={(e) => updateInput('zinssatz', e.target.value)}
                      placeholder="3.5"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Mieteinnahmen</h4>
                  <div>
                    <Label>Jährliche Miete (€) *</Label>
                    <Input
                      type="number"
                      value={input.jaehrliche_miete}
                      onChange={(e) => updateInput('jaehrliche_miete', e.target.value)}
                      placeholder="30000"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Kosten</h4>
                  <div className="space-y-2">
                    <div>
                      <Label>Nebenkosten (€/Jahr)</Label>
                      <Input
                        type="number"
                        value={input.nebenkosten}
                        onChange={(e) => updateInput('nebenkosten', e.target.value)}
                        placeholder="2400"
                      />
                    </div>
                    <div>
                      <Label>Instandhaltung (€/Jahr)</Label>
                      <Input
                        type="number"
                        value={input.instandhaltung}
                        onChange={(e) => updateInput('instandhaltung', e.target.value)}
                        placeholder="3000"
                      />
                    </div>
                    <div>
                      <Label>Renovierung (€/Jahr, Rückstellung)</Label>
                      <Input
                        type="number"
                        value={input.renovierung}
                        onChange={(e) => updateInput('renovierung', e.target.value)}
                        placeholder="1500"
                      />
                    </div>
                    <div>
                      <Label>Leerstand (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={input.leerstand}
                        onChange={(e) => updateInput('leerstand', e.target.value)}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={calculate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Berechnen
                </Button>
              </div>
            </FormSection>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-indigo-200 bg-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Ergebnisse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Bruttomiete/Jahr:</span>
                        <span className="font-semibold">{result.brutto_miete}€</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Kosten:</span>
                        <span>-{result.kosten_summe}€</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Leerstand:</span>
                        <span>-{result.leerstand_verlust}€</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Nettomiete/Jahr:</span>
                        <span className="text-green-600">{result.netto_miete}€</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Zinskosten:</span>
                        <span>-{result.zinskosten}€</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Cashflow/Jahr:</span>
                        <span className="text-blue-600">{result.cashflow}€</span>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600">Mietrendite</p>
                        <p className="text-2xl font-bold text-green-600">
                          {result.rendite}%
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600">Cashflow-Rendite</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {result.cashflow_rendite}%
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