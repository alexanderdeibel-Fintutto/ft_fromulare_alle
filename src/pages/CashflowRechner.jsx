import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Calculator, Save, Plus, Trash2 } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function CashflowRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    zeitraum: '12', // Monate
    einnahmen: [
      { name: 'Mieteinkünfte', betrag: '' },
      { name: 'Nebenkostenerstattung', betrag: '' }
    ],
    ausgaben: [
      { name: 'Hypothek/Darlehen', betrag: '' },
      { name: 'Instandhaltung', betrag: '' },
      { name: 'Verwaltung', betrag: '' },
      { name: 'Versicherung', betrag: '' },
      { name: 'Steuern', betrag: '' }
    ]
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

  const addEinnahme = () => {
    setInput(prev => ({
      ...prev,
      einnahmen: [...prev.einnahmen, { name: '', betrag: '' }]
    }));
  };

  const removeEinnahme = (idx) => {
    setInput(prev => ({
      ...prev,
      einnahmen: prev.einnahmen.filter((_, i) => i !== idx)
    }));
  };

  const updateEinnahme = (idx, field, value) => {
    setInput(prev => ({
      ...prev,
      einnahmen: prev.einnahmen.map((e, i) => i === idx ? { ...e, [field]: value } : e)
    }));
  };

  const addAusgabe = () => {
    setInput(prev => ({
      ...prev,
      ausgaben: [...prev.ausgaben, { name: '', betrag: '' }]
    }));
  };

  const removeAusgabe = (idx) => {
    setInput(prev => ({
      ...prev,
      ausgaben: prev.ausgaben.filter((_, i) => i !== idx)
    }));
  };

  const updateAusgabe = (idx, field, value) => {
    setInput(prev => ({
      ...prev,
      ausgaben: prev.ausgaben.map((a, i) => i === idx ? { ...a, [field]: value } : a)
    }));
  };

  const calculate = () => {
    const zeitraum = parseInt(input.zeitraum) || 12;
    
    const einnahmen_monatlich = input.einnahmen.reduce((sum, e) => {
      return sum + (parseFloat(e.betrag) || 0);
    }, 0);

    const ausgaben_monatlich = input.ausgaben.reduce((sum, a) => {
      return sum + (parseFloat(a.betrag) || 0);
    }, 0);

    const cashflow_monatlich = einnahmen_monatlich - ausgaben_monatlich;
    const cashflow_zeitraum = cashflow_monatlich * zeitraum;

    const einnahmen_details = input.einnahmen.map(e => ({
      name: e.name,
      monatlich: (parseFloat(e.betrag) || 0).toFixed(2),
      zeitraum: ((parseFloat(e.betrag) || 0) * zeitraum).toFixed(2)
    }));

    const ausgaben_details = input.ausgaben.map(a => ({
      name: a.name,
      monatlich: (parseFloat(a.betrag) || 0).toFixed(2),
      zeitraum: ((parseFloat(a.betrag) || 0) * zeitraum).toFixed(2)
    }));

    setResult({
      einnahmen_monatlich: einnahmen_monatlich.toFixed(2),
      einnahmen_zeitraum: (einnahmen_monatlich * zeitraum).toFixed(2),
      ausgaben_monatlich: ausgaben_monatlich.toFixed(2),
      ausgaben_zeitraum: (ausgaben_monatlich * zeitraum).toFixed(2),
      cashflow_monatlich: cashflow_monatlich.toFixed(2),
      cashflow_zeitraum: cashflow_zeitraum.toFixed(2),
      zeitraum,
      einnahmen_details,
      ausgaben_details
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
        tool_name: 'Cashflow-Rechner',
        tool_id: 'cashflow_rechner',
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
            💰 Cashflow-Rechner
          </h1>
          <p className="text-gray-600">
            Kalkulieren Sie monatliche und jährliche Einnahmen und Ausgaben
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-3">
            <FormSection title="Zeitraum" collapsible={false}>
              <div>
                <Label>Betrachtungszeitraum (Monate)</Label>
                <Input
                  type="number"
                  value={input.zeitraum}
                  onChange={(e) => setInput(prev => ({ ...prev, zeitraum: e.target.value }))}
                  placeholder="12"
                />
              </div>
            </FormSection>

            <FormSection title="Einnahmen (monatlich)" collapsible={false} className="mt-4">
              <div className="space-y-4">
                {input.einnahmen.map((ein, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <Label className="text-xs">Einnahmeart</Label>
                      <Input
                        value={ein.name}
                        onChange={(e) => updateEinnahme(idx, 'name', e.target.value)}
                        placeholder="z.B. Miete"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Betrag (€)</Label>
                        <Input
                          type="number"
                          value={ein.betrag}
                          onChange={(e) => updateEinnahme(idx, 'betrag', e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                      <Button
                        onClick={() => removeEinnahme(idx)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addEinnahme}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Einnahmeart hinzufügen
                </Button>
              </div>
            </FormSection>

            <FormSection title="Ausgaben (monatlich)" collapsible={false} className="mt-4">
              <div className="space-y-4">
                {input.ausgaben.map((aus, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <Label className="text-xs">Ausgabenart</Label>
                      <Input
                        value={aus.name}
                        onChange={(e) => updateAusgabe(idx, 'name', e.target.value)}
                        placeholder="z.B. Hypothek"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Betrag (€)</Label>
                        <Input
                          type="number"
                          value={aus.betrag}
                          onChange={(e) => updateAusgabe(idx, 'betrag', e.target.value)}
                          placeholder="500"
                        />
                      </div>
                      <Button
                        onClick={() => removeAusgabe(idx)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addAusgabe}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ausgabenart hinzufügen
                </Button>
              </div>
            </FormSection>

            <Button
              onClick={calculate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Cashflow berechnen
            </Button>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-green-200 bg-green-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Cashflow-Übersicht</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="bg-white rounded p-3 border border-green-300">
                      <p className="text-xs text-gray-600 mb-1">Monatlicher Cashflow</p>
                      <p className={`text-lg font-bold ${parseFloat(result.cashflow_monatlich) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(result.cashflow_monatlich) >= 0 ? '+' : ''}{parseFloat(result.cashflow_monatlich).toLocaleString('de-DE')}€
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-blue-300">
                      <p className="text-xs text-gray-600 mb-1">Cashflow {result.zeitraum} Monate</p>
                      <p className={`text-lg font-bold ${parseFloat(result.cashflow_zeitraum) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(result.cashflow_zeitraum) >= 0 ? '+' : ''}{parseFloat(result.cashflow_zeitraum).toLocaleString('de-DE')}€
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200 mb-4">
                  <CardHeader>
                    <CardTitle className="text-xs">Einnahmen (monatlich)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    {result.einnahmen_details.map((ein, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{ein.name}:</span>
                        <span className="font-bold">{parseFloat(ein.monatlich).toLocaleString('de-DE')}€</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                      <span>Summe:</span>
                      <span>{parseFloat(result.einnahmen_monatlich).toLocaleString('de-DE')}€</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-xs">Ausgaben (monatlich)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    {result.ausgaben_details.map((aus, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{aus.name}:</span>
                        <span className="font-bold">-{parseFloat(aus.monatlich).toLocaleString('de-DE')}€</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                      <span>Summe:</span>
                      <span>-{parseFloat(result.ausgaben_monatlich).toLocaleString('de-DE')}€</span>
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