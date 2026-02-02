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

export default function IndexmietRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    ausgangmiete: '',
    ausgangsjahr: '2020',
    index_ausgangsjahr: '100',
    index_aktuell: '115',
    prognose_index: '125'
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
    const ausgang = parseFloat(input.ausgangmiete);
    const index_start = parseFloat(input.index_ausgangsjahr);
    const index_current = parseFloat(input.index_aktuell);
    const index_future = parseFloat(input.prognose_index);

    if (!ausgang || !index_start || !index_current) {
      toast.error('Ausgangmiete und Indizes erforderlich');
      return;
    }

    // Mietanpassung nach Indexentwicklung
    const steigerungsfaktor_aktuell = index_current / index_start;
    const neue_miete_aktuell = ausgang * steigerungsfaktor_aktuell;
    const erhoehung_betrag = neue_miete_aktuell - ausgang;
    const erhoehung_prozent = ((neue_miete_aktuell - ausgang) / ausgang) * 100;

    // Prognose
    const steigerungsfaktor_future = index_future / index_start;
    const neue_miete_future = ausgang * steigerungsfaktor_future;
    const erhoehung_future = neue_miete_future - ausgang;

    // Monatliche Differenzen
    const ersparnis_pro_monat = erhoehung_betrag;
    const ersparnis_pro_jahr = ersparnis_pro_monat * 12;

    // Mehrbelastung vs freie Mieterhöhung (2% p.a. angenommen)
    const freie_erhoehung_2pct = ausgang * 0.02 * Math.floor((parseFloat(input.ausgangsjahr) || 2020) - 2020);
    const vorteil_durch_indexmiet = Math.max(0, freie_erhoehung_2pct - erhoehung_betrag);

    setResult({
      ausgangmiete: ausgang.toFixed(2),
      neue_miete_aktuell: neue_miete_aktuell.toFixed(2),
      erhoehung_betrag: erhoehung_betrag.toFixed(2),
      erhoehung_prozent: erhoehung_prozent.toFixed(2),
      neue_miete_future: neue_miete_future.toFixed(2),
      erhoehung_future: erhoehung_future.toFixed(2),
      ersparnis_pro_jahr: ersparnis_pro_jahr.toFixed(2),
      index_aktuell: index_current.toFixed(1),
      index_future: index_future.toFixed(1)
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
        tool_name: 'Indexmietrechner',
        tool_id: 'indexmiet_rechner',
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
            📈 Indexmietrechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie Mietanpassungen nach Verbraucherpreisindex (VPI)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Ausgangsdaten" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Indexmietklausel:</strong> Mietanpassung nach VPI ist flexibel und transparent
                  </p>
                </div>

                <div>
                  <Label>Ausgangmiete (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={input.ausgangmiete}
                    onChange={(e) => updateInput('ausgangmiete', e.target.value)}
                    placeholder="1000"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ausgangsjahr (Vertrag) *</Label>
                    <Input
                      type="number"
                      value={input.ausgangsjahr}
                      onChange={(e) => updateInput('ausgangsjahr', e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <Label>VPI-Index Basis (100) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={input.index_ausgangsjahr}
                      onChange={(e) => updateInput('index_ausgangsjahr', e.target.value)}
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>VPI-Index Aktuell *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={input.index_aktuell}
                      onChange={(e) => updateInput('index_aktuell', e.target.value)}
                      placeholder="115"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quelle: Statistisches Bundesamt
                    </p>
                  </div>
                  <div>
                    <Label>VPI-Index Prognose</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={input.prognose_index}
                      onChange={(e) => updateInput('prognose_index', e.target.value)}
                      placeholder="125"
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
                <Card className="border-2 border-blue-200 bg-blue-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Aktuelle Anpassung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Ausgangmiete</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.ausgangmiete).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-blue-300">
                        <p className="text-xs text-gray-600 mb-1">Neue Miete (aktuell)</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {parseFloat(result.neue_miete_aktuell).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-green-300">
                        <p className="text-xs text-gray-600 mb-1">Erhöhung pro Monat</p>
                        <p className="text-lg font-bold text-green-600">
                          +{parseFloat(result.erhoehung_betrag).toLocaleString('de-DE')}€
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({result.erhoehung_prozent}%)
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Erhöhung pro Jahr</p>
                        <p className="text-lg font-bold text-gray-900">
                          +{parseFloat(result.ersparnis_pro_jahr).toLocaleString('de-DE')}€
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Prognose</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="bg-white rounded p-2 border border-amber-200">
                        <p className="text-xs text-gray-600">Neue Miete (Prognose Index {result.index_future})</p>
                        <p className="text-lg font-bold text-amber-600">
                          {parseFloat(result.neue_miete_future).toLocaleString('de-DE')}€
                        </p>
                      </div>
                      <div className="bg-white rounded p-2 border border-amber-200">
                        <p className="text-xs text-gray-600">Weitere Erhöhung</p>
                        <p className="text-lg font-bold text-amber-600">
                          +{parseFloat(result.erhoehung_future).toLocaleString('de-DE')}€
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