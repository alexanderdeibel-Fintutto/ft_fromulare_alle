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

export default function BewertungsRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    jahreseinkuenfte: '',
    betriebskosten: '',
    leerstandsquote: '5',
    kapitalisierungszins: '5',
    erwerbsnebenkosten_prozent: '8'
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
    const jahresein = parseFloat(input.jahreseinkuenfte);
    const betriebsk = parseFloat(input.betriebskosten);
    const leerstand = parseFloat(input.leerstandsquote) / 100;
    const kap_zins = parseFloat(input.kapitalisierungszins) / 100;
    const erwerbsneben = parseFloat(input.erwerbsnebenkosten_prozent) / 100;

    if (!jahresein || !betriebsk || !kap_zins) {
      toast.error('Erforderliche Felder ausfüllen');
      return;
    }

    // Reinertrag-Methode (vereinfacht)
    const leerstands_minderung = jahresein * leerstand;
    const mieteinnahmen_netto = jahresein - leerstands_minderung;
    const reinertrag = mieteinnahmen_netto - betriebsk;

    // Objektwert nach Reinertrag-Methode
    const objektwert = reinertrag / kap_zins;

    // Kaufpreis (mit Erwerbsnebenkosten)
    const kaufpreis_netto = objektwert;
    const erwerbsneben_betrag = objektwert * erwerbsneben;
    const kaufpreis_brutto = kaufpreis_netto + erwerbsneben_betrag;

    // Vergleichswert-Spanne (+-10%)
    const vergleichswert_min = objektwert * 0.9;
    const vergleichswert_max = objektwert * 1.1;

    // Bruttomietrendite
    const bruttomietrendite = (jahresein / kaufpreis_brutto) * 100;

    // Nettomietrendite
    const nettomietrendite = (reinertrag / kaufpreis_brutto) * 100;

    setResult({
      mieteinnahmen_brutto: jahresein.toFixed(2),
      leerstands_minderung: leerstands_minderung.toFixed(2),
      mieteinnahmen_netto: mieteinnahmen_netto.toFixed(2),
      betriebskosten: betriebsk.toFixed(2),
      reinertrag: reinertrag.toFixed(2),
      objektwert: objektwert.toFixed(2),
      erwerbsnebenkosten: erwerbsneben_betrag.toFixed(2),
      kaufpreis_brutto: kaufpreis_brutto.toFixed(2),
      vergleichswert_min: vergleichswert_min.toFixed(2),
      vergleichswert_max: vergleichswert_max.toFixed(2),
      bruttomietrendite: bruttomietrendite.toFixed(2),
      nettomietrendite: nettomietrendite.toFixed(2),
      kap_zins_prozent: (kap_zins * 100).toFixed(2)
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
        tool_name: 'Bewertungsrechner',
        tool_id: 'bewertungs_rechner',
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
            🏘️ Immobilienbewertungsrechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie den Wert einer Immobilie nach der Reinertrag-Methode
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Ertragsdaten" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Reinertrag-Methode:</strong> Wert = Reinertrag ÷ Kapitalisierungszinssatz
                  </p>
                </div>

                <div>
                  <Label>Jährliche Mieteinnahmen (€) *</Label>
                  <Input
                    type="number"
                    value={input.jahreseinkuenfte}
                    onChange={(e) => updateInput('jahreseinkuenfte', e.target.value)}
                    placeholder="50000"
                  />
                </div>

                <div>
                  <Label>Jährliche Betriebskosten (€) *</Label>
                  <Input
                    type="number"
                    value={input.betriebskosten}
                    onChange={(e) => updateInput('betriebskosten', e.target.value)}
                    placeholder="15000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Heizung, Wasser, Versicherung, Instandhaltung, etc.
                  </p>
                </div>

                <div>
                  <Label>Leerstandsquote (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={input.leerstandsquote}
                    onChange={(e) => updateInput('leerstandsquote', e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Typisch 3-8% je nach Marktlage
                  </p>
                </div>

                <div>
                  <Label>Kapitalisierungszinssatz (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={input.kapitalisierungszins}
                    onChange={(e) => updateInput('kapitalisierungszins', e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Marktübliche Rendite: 3-7% je nach Lage
                  </p>
                </div>

                <div>
                  <Label>Erwerbsnebenkosten (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={input.erwerbsnebenkosten_prozent}
                    onChange={(e) => updateInput('erwerbsnebenkosten_prozent', e.target.value)}
                    placeholder="8"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Makler, Notargebühren, Grundsteuer (ca. 6-10%)
                  </p>
                </div>

                <Button
                  onClick={calculate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Wert berechnen
                </Button>
              </div>
            </FormSection>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-indigo-200 bg-indigo-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Objektwert</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-white rounded p-3 border border-indigo-300">
                      <p className="text-xs text-gray-600 mb-1">Reinertrag p.a.</p>
                      <p className="text-lg font-bold text-gray-900">
                        {parseFloat(result.reinertrag).toLocaleString('de-DE')}€
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-green-300">
                      <p className="text-xs text-gray-600 mb-1">Objektwert (netto)</p>
                      <p className="text-2xl font-bold text-green-600">
                        {parseFloat(result.objektwert).toLocaleString('de-DE')}€
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-blue-300">
                      <p className="text-xs text-gray-600 mb-1">Kaufpreis (brutto mit NK)</p>
                      <p className="text-xl font-bold text-blue-600">
                        {parseFloat(result.kaufpreis_brutto).toLocaleString('de-DE')}€
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-200 bg-purple-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Renditen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="bg-white rounded p-2 border border-purple-200">
                      <p className="text-xs text-gray-600">Bruttomietrendite</p>
                      <p className="text-lg font-bold text-purple-600">{result.bruttomietrendite}%</p>
                    </div>
                    <div className="bg-white rounded p-2 border border-purple-200">
                      <p className="text-xs text-gray-600">Nettomietrendite</p>
                      <p className="text-lg font-bold text-purple-600">{result.nettomietrendite}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-xs">Vergleichswert-Spanne</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Min (−10%):</span>
                      <span className="font-bold">{parseFloat(result.vergleichswert_min).toLocaleString('de-DE')}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max (+10%):</span>
                      <span className="font-bold">{parseFloat(result.vergleichswert_max).toLocaleString('de-DE')}€</span>
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