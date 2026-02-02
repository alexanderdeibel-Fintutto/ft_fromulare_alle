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

export default function KaufpreisRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    jaehrliche_miete: '',
    gewuenschte_rendite: '',
    kapitalanlage: '',
    bewirtschaftungskosten: ''
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
    const jaehrliche_miete = parseFloat(input.jaehrliche_miete) || 0;
    const gewuenschte_rendite = parseFloat(input.gewuenschte_rendite) || 0;
    const kapitalanlage = parseFloat(input.kapitalanlage) || 0;
    const bewirtschaftungskosten = parseFloat(input.bewirtschaftungskosten) || 0;

    if (!jaehrliche_miete || !gewuenschte_rendite) {
      toast.error('Jährliche Miete und gewünschte Rendite erforderlich');
      return;
    }

    // Berechnung
    const netto_miete = jaehrliche_miete - bewirtschaftungskosten;
    const max_kaufpreis_rendite = (netto_miete / gewuenschte_rendite) * 100;
    const max_kaufpreis_kapital = kapitalanlage > 0 ? (netto_miete / gewuenschte_rendite) * 100 : max_kaufpreis_rendite;
    
    const realistische_kaufpreis = Math.min(max_kaufpreis_rendite, max_kaufpreis_kapital);
    const tatsaechliche_rendite = (netto_miete / realistische_kaufpreis) * 100;

    setResult({
      netto_miete: netto_miete.toFixed(2),
      max_kaufpreis_rendite: max_kaufpreis_rendite.toFixed(2),
      tatsaechliche_rendite: tatsaechliche_rendite.toFixed(2),
      realistische_kaufpreis: realistische_kaufpreis.toFixed(2)
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
        tool_name: 'Kaufpreisrechner',
        tool_id: 'kaufpreis_rechner',
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
            💰 Kaufpreisrechner
          </h1>
          <p className="text-gray-600">
            Ermitteln Sie den maximalen Kaufpreis basierend auf gewünschter Rendite
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Eingaben" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Formel:</strong> Maximaler Kaufpreis = (Jährliche Miete - Kosten) / Gewünschte Rendite × 100
                  </p>
                </div>

                <div>
                  <Label>Jährliche Miete (€) *</Label>
                  <Input
                    type="number"
                    value={input.jaehrliche_miete}
                    onChange={(e) => updateInput('jaehrliche_miete', e.target.value)}
                    placeholder="36000"
                  />
                  <p className="text-xs text-gray-600 mt-1">z.B. 3000€ Monatsmiete × 12</p>
                </div>

                <div>
                  <Label>Bewirtschaftungskosten (€/Jahr)</Label>
                  <Input
                    type="number"
                    value={input.bewirtschaftungskosten}
                    onChange={(e) => updateInput('bewirtschaftungskosten', e.target.value)}
                    placeholder="5400"
                  />
                  <p className="text-xs text-gray-600 mt-1">Nebenkosten + Instandhaltung + Rücklagen</p>
                </div>

                <div>
                  <Label>Gewünschte Rendite (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={input.gewuenschte_rendite}
                    onChange={(e) => updateInput('gewuenschte_rendite', e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-600 mt-1">Übliche Spannweite: 3-8%</p>
                </div>

                <div>
                  <Label>Vorhandenes Kapital (€, optional)</Label>
                  <Input
                    type="number"
                    value={input.kapitalanlage}
                    onChange={(e) => updateInput('kapitalanlage', e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-600 mt-1">Beeinflusst nicht die Berechnung</p>
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
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Ergebnisse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Nettomiete/Jahr</p>
                        <p className="text-xl font-bold text-gray-900">
                          {result.netto_miete}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-green-300">
                        <p className="text-xs text-gray-600 mb-1">Max. Kaufpreis für {input.gewuenschte_rendite}% Rendite</p>
                        <p className="text-2xl font-bold text-green-600">
                          {result.max_kaufpreis_rendite}€
                        </p>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Tatsächliche Rendite</p>
                        <p className="text-xl font-bold text-blue-600">
                          {result.tatsaechliche_rendite}%
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-3 text-xs text-gray-600">
                      <p>✓ Bei diesem Kaufpreis erreichen Sie die gewünschte Rendite.</p>
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