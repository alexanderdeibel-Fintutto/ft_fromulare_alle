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

export default function NebenkostenUmlageRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    gesamtwohnflaeche: '',
    umlageschluessel: 'flaeche', // flaeche oder personen
    einheiten: [
      { name: 'Wohnung 1', wohnflaeche: '', personen: '' },
      { name: 'Wohnung 2', wohnflaeche: '', personen: '' }
    ],
    nebenkosten: [
      { name: 'Heizung', betrag: '' },
      { name: 'Wasser/Abwasser', betrag: '' }
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

  const updateInput = (field, value) => {
    setInput(prev => ({ ...prev, [field]: value }));
    setResult(null);
  };

  const addEinheit = () => {
    setInput(prev => ({
      ...prev,
      einheiten: [...prev.einheiten, { name: `Wohnung ${prev.einheiten.length + 1}`, wohnflaeche: '', personen: '' }]
    }));
  };

  const removeEinheit = (idx) => {
    setInput(prev => ({
      ...prev,
      einheiten: prev.einheiten.filter((_, i) => i !== idx)
    }));
  };

  const updateEinheit = (idx, field, value) => {
    setInput(prev => ({
      ...prev,
      einheiten: prev.einheiten.map((e, i) => i === idx ? { ...e, [field]: value } : e)
    }));
  };

  const addNebenkosten = () => {
    setInput(prev => ({
      ...prev,
      nebenkosten: [...prev.nebenkosten, { name: 'Nebenkosten', betrag: '' }]
    }));
  };

  const removeNebenkosten = (idx) => {
    setInput(prev => ({
      ...prev,
      nebenkosten: prev.nebenkosten.filter((_, i) => i !== idx)
    }));
  };

  const updateNebenkosten = (idx, field, value) => {
    setInput(prev => ({
      ...prev,
      nebenkosten: prev.nebenkosten.map((nk, i) => i === idx ? { ...nk, [field]: value } : nk)
    }));
  };

  const calculate = () => {
    if (input.einheiten.length === 0 || input.nebenkosten.length === 0) {
      toast.error('Mindestens 1 Einheit und 1 Nebenkostenposition erforderlich');
      return;
    }

    const valid_einheiten = input.einheiten.filter(e => 
      input.umlageschluessel === 'flaeche' ? e.wohnflaeche : e.personen
    );

    if (valid_einheiten.length === 0) {
      toast.error(`Gültige Einheiten erforderlich (${input.umlageschluessel === 'flaeche' ? 'Wohnfläche' : 'Personen'})`);
      return;
    }

    // Gesamtnebenkosten
    const nebenkosten_gesamt = input.nebenkosten.reduce((sum, nk) => {
      return sum + (parseFloat(nk.betrag) || 0);
    }, 0);

    // Umlageschlüssel berechnen
    let gesamt_schluessel = 0;
    const schluessel_pro_einheit = valid_einheiten.map(e => {
      const schluessel = input.umlageschluessel === 'flaeche' 
        ? parseFloat(e.wohnflaeche)
        : parseFloat(e.personen);
      gesamt_schluessel += schluessel;
      return schluessel;
    });

    // Umlageergebnisse
    const ergebnisse = valid_einheiten.map((einheit, idx) => {
      const schluessel = schluessel_pro_einheit[idx];
      const anteil = schluessel / gesamt_schluessel;
      const umlagebetrag = nebenkosten_gesamt * anteil;

      return {
        name: einheit.name,
        schluessel: schluessel.toFixed(input.umlageschluessel === 'flaeche' ? 2 : 0),
        anteil_prozent: (anteil * 100).toFixed(1),
        umlagebetrag: umlagebetrag.toFixed(2)
      };
    });

    setResult({
      nebenkosten_gesamt: nebenkosten_gesamt.toFixed(2),
      ergebnisse,
      umlageschluessel: input.umlageschluessel,
      einheiten_count: valid_einheiten.length
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
        tool_name: 'Nebenkostenumlagenrechner',
        tool_id: 'nebenkosten_umlage_rechner',
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
            🏢 Nebenkostenumlagenrechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie gerechte Nebenkostenumlagen nach Fläche oder Personenanzahl
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-3">
            <FormSection title="Umlageschlüssel" collapsible={false}>
              <div>
                <label className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="flaeche"
                      checked={input.umlageschluessel === 'flaeche'}
                      onChange={(e) => updateInput('umlageschluessel', e.target.value)}
                    />
                    Nach Wohnfläche (m²)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="personen"
                      checked={input.umlageschluessel === 'personen'}
                      onChange={(e) => updateInput('umlageschluessel', e.target.value)}
                    />
                    Nach Personenanzahl
                  </label>
                </label>
              </div>
            </FormSection>

            <FormSection title="Wohneinheiten" collapsible={false} className="mt-4">
              <div className="space-y-4">
                {input.einheiten.map((einheit, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{einheit.name}</span>
                      <Button
                        onClick={() => removeEinheit(idx)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    {input.umlageschluessel === 'flaeche' ? (
                      <div>
                        <Label className="text-xs">Wohnfläche (m²)</Label>
                        <Input
                          type="number"
                          value={einheit.wohnflaeche}
                          onChange={(e) => updateEinheit(idx, 'wohnflaeche', e.target.value)}
                          placeholder="75"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs">Anzahl Personen</Label>
                        <Input
                          type="number"
                          value={einheit.personen}
                          onChange={(e) => updateEinheit(idx, 'personen', e.target.value)}
                          placeholder="2"
                        />
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  onClick={addEinheit}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Wohneinheit hinzufügen
                </Button>
              </div>
            </FormSection>

            <FormSection title="Nebenkosten" collapsible={false} className="mt-4">
              <div className="space-y-4">
                {input.nebenkosten.map((nk, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <Label className="text-xs">Kostenart</Label>
                      <Input
                        value={nk.name}
                        onChange={(e) => updateNebenkosten(idx, 'name', e.target.value)}
                        placeholder="z.B. Heizung"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Betrag (€)</Label>
                        <Input
                          type="number"
                          value={nk.betrag}
                          onChange={(e) => updateNebenkosten(idx, 'betrag', e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                      <Button
                        onClick={() => removeNebenkosten(idx)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addNebenkosten}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Kostenart hinzufügen
                </Button>
              </div>
            </FormSection>

            <Button
              onClick={calculate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Umlagen berechnen
            </Button>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-cyan-200 bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Umlageberechnung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-white rounded p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Gesamtnebenkosten</p>
                      <p className="text-lg font-bold text-gray-900">
                        {parseFloat(result.nebenkosten_gesamt).toLocaleString('de-DE')}€
                      </p>
                    </div>

                    <div className="space-y-2">
                      {result.ergebnisse.map((erg, idx) => (
                        <div key={idx} className="bg-white rounded p-2 border border-cyan-200 text-xs">
                          <p className="font-semibold text-gray-900">{erg.name}</p>
                          <div className="flex justify-between mt-1">
                            <span>Anteil:</span>
                            <span className="font-bold">{erg.anteil_prozent}%</span>
                          </div>
                          <div className="flex justify-between text-cyan-600 font-bold">
                            <span>Umlage:</span>
                            <span>{parseFloat(erg.umlagebetrag).toLocaleString('de-DE')}€</span>
                          </div>
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