import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Calculator, Save, AlertCircle } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function MieterhöhungsRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    aktuelle_miete: '',
    letzte_erhoehung_jahre: '',
    mietspiegel: '',
    ist_erhoehung_erlaubt: 'unknown' // unknown, ja, nein
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
    const aktuelle_miete = parseFloat(input.aktuelle_miete);
    const mietspiegel = parseFloat(input.mietspiegel);
    const letzte_erhoehung = parseInt(input.letzte_erhoehung_jahre);

    if (!aktuelle_miete || !mietspiegel) {
      toast.error('Aktuelle Miete und Mietspiegel erforderlich');
      return;
    }

    if (letzte_erhoehung < 0) {
      toast.error('Zeitraum muss >= 0 sein');
      return;
    }

    // Regelung: Mieterhöhung frühestens nach 1 Jahr und maximal 20% in 3 Jahren
    const erhoehung_erlaubt = letzte_erhoehung >= 1;
    const max_erhoehung_prozent = 20;
    const max_miete = aktuelle_miete * (1 + max_erhoehung_prozent / 100);
    
    // Zulässige Erhöhung: niedrigster Wert von:
    // 1. Mietspiegel
    // 2. Aktuelle Miete + 20% (3-Jahre-Regel)
    const zulaessige_neue_miete = Math.min(mietspiegel, max_miete);
    const moegliche_erhoehung = zulaessige_neue_miete - aktuelle_miete;
    const erhoehung_prozent = (moegliche_erhoehung / aktuelle_miete) * 100;
    const monatliche_mehrbelastung = moegliche_erhoehung;

    let empfehlung = '';
    if (!erhoehung_erlaubt) {
      empfehlung = 'Mieterhöhung nicht zulässig: Letzter Zeitpunkt liegt weniger als 1 Jahr zurück';
    } else if (moegliche_erhoehung <= 0) {
      empfehlung = 'Aktuelle Miete liegt bereits am oder über der zulässigen Erhöhung';
    } else {
      empfehlung = `Mieterhöhung bis ${zulaessige_neue_miete.toFixed(2)}€ möglich`;
    }

    setResult({
      erhoehung_erlaubt,
      zulaessige_neue_miete: zulaessige_neue_miete.toFixed(2),
      moegliche_erhoehung: Math.max(0, moegliche_erhoehung).toFixed(2),
      erhoehung_prozent: Math.max(0, erhoehung_prozent).toFixed(2),
      monatliche_mehrbelastung: Math.max(0, monatliche_mehrbelastung).toFixed(2),
      empfehlung
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
        tool_name: 'Mieterhöhungsrechner',
        tool_id: 'mieterhoehung_rechner',
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
            📈 Mieterhöhungsrechner
          </h1>
          <p className="text-gray-600">
            Prüfen Sie die Zulässigkeit und das Ausmaß einer Mieterhöhung
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Eingaben" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    <strong>Rechtliche Limits:</strong> Erhöhung frühestens nach 1 Jahr, max. 20% in 3 Jahren
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Aktuelle Monatsmiete (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={input.aktuelle_miete}
                      onChange={(e) => updateInput('aktuelle_miete', e.target.value)}
                      placeholder="950"
                    />
                  </div>
                  <div>
                    <Label>Ortsübliche Vergleichsmiete (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={input.mietspiegel}
                      onChange={(e) => updateInput('mietspiegel', e.target.value)}
                      placeholder="1100"
                    />
                  </div>
                </div>

                <div>
                  <Label>Letzte Mieterhöhung vor X Jahren *</Label>
                  <Input
                    type="number"
                    value={input.letzte_erhoehung_jahre}
                    onChange={(e) => updateInput('letzte_erhoehung_jahre', e.target.value)}
                    placeholder="2"
                  />
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
                <Card className={`border-2 ${result.erhoehung_erlaubt ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">Ergebnis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Status</p>
                        <p className={`text-sm font-bold ${result.erhoehung_erlaubt ? 'text-green-600' : 'text-red-600'}`}>
                          {result.erhoehung_erlaubt ? '✓ Erhöhung möglich' : '✗ Erhöhung nicht zulässig'}
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Max. neue Miete</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(result.zulaessige_neue_miete).toLocaleString('de-DE')}€
                        </p>
                      </div>

                      {parseFloat(result.moegliche_erhoehung) > 0 && (
                        <>
                          <div className="bg-white rounded p-3 border border-blue-200">
                            <p className="text-xs text-gray-600 mb-1">Erhöhung möglich</p>
                            <p className="text-lg font-bold text-blue-600">
                              +{parseFloat(result.moegliche_erhoehung).toLocaleString('de-DE')}€
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              ({result.erhoehung_prozent}%)
                            </p>
                          </div>

                          <div className="bg-white rounded p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Monatliche Mehrbelastung</p>
                            <p className="text-sm font-bold text-gray-900">
                              {parseFloat(result.monatliche_mehrbelastung).toLocaleString('de-DE')}€/Monat
                            </p>
                          </div>
                        </>
                      )}

                      <div className="bg-blue-50 rounded p-3 border border-blue-200 mt-4">
                        <p className="text-xs font-semibold text-blue-900">Empfehlung:</p>
                        <p className="text-xs text-blue-800 mt-1">{result.empfehlung}</p>
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