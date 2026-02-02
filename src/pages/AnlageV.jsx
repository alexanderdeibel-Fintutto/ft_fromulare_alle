import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';

export default function AnlageV() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    steuerjahr: new Date().getFullYear(),
    objekt_adresse: '',
    kaufpreis_gebaeude: '',
    gebaudeanteil_prozent: 80,
    baujahr: '',
    mieteinnahmen_jährlich: '',
    nebenkosten_vorauszahlung: '',
    schuldzinsen: '',
    grundsteuer: '',
    gebaeudeversicherung: '',
    hausverwaltung: '',
    instandhaltung: '',
    weitere_kosten: []
  });

  useEffect(() => {
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

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addWerbungskosten = () => {
    setFormData(prev => ({
      ...prev,
      weitere_kosten: [...prev.weitere_kosten, { art: '', betrag: '' }]
    }));
  };

  const removeWerbungskosten = (index) => {
    setFormData(prev => ({
      ...prev,
      weitere_kosten: prev.weitere_kosten.filter((_, i) => i !== index)
    }));
  };

  const updateWerbungskosten = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      weitere_kosten: prev.weitere_kosten.map((k, i) =>
        i === index ? { ...k, [field]: value } : k
      )
    }));
  };

  const calculateAnlageV = () => {
    const kaufpreis = parseFloat(formData.kaufpreis_gebaeude) || 0;
    const gebaudeanteil = parseFloat(formData.gebaudeanteil_prozent) || 80;
    const bemessungsgrundlage = (kaufpreis * gebaudeanteil) / 100;
    
    const baujahr = parseInt(formData.baujahr) || new Date().getFullYear();
    const afa_satz = baujahr > 2023 ? 3 : baujahr > 1990 ? 2 : 1;
    const jaehrliche_afa = (bemessungsgrundlage * afa_satz) / 100;

    const einnahmen = (parseFloat(formData.mieteinnahmen_jährlich) || 0) +
                      (parseFloat(formData.nebenkosten_vorauszahlung) || 0);

    const werbungskosten = (parseFloat(formData.schuldzinsen) || 0) +
                           (parseFloat(formData.grundsteuer) || 0) +
                           (parseFloat(formData.gebaeudeversicherung) || 0) +
                           (parseFloat(formData.hausverwaltung) || 0) +
                           (parseFloat(formData.instandhaltung) || 0) +
                           jaehrliche_afa +
                           formData.weitere_kosten.reduce((sum, k) => sum + (parseFloat(k.betrag) || 0), 0);

    const einkuenfte = einnahmen - werbungskosten;

    setResult({
      einnahmen,
      werbungskosten,
      jaehrliche_afa,
      bemessungsgrundlage,
      afa_satz,
      einkuenfte,
      grenzsteuersatz: 0.42,
      steuereinsparung: Math.abs(einkuenfte) * 0.42
    });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.objekt_adresse || !formData.kaufpreis_gebaeude || !formData.baujahr) {
        toast.error('Bitte Adresse, Kaufpreis und Baujahr angeben');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.mieteinnahmen_jährlich) {
        toast.error('Bitte Mieteinnahmen angeben');
        return;
      }
      calculateAnlageV();
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generateDocument = async () => {
    setLoading(true);
    try {
      const docResult = await base44.functions.invoke('generateDocument', {
        template_id: 'anlage_v',
        data: {
          steuerjahr: formData.steuerjahr,
          objekt: {
            adresse: formData.objekt_adresse,
            kaufpreis: formData.kaufpreis_gebaeude,
            gebaudeanteil: formData.gebaudeanteil_prozent,
            baujahr: formData.baujahr
          },
          einnahmen: {
            miete: formData.mieteinnahmen_jährlich,
            nebenkosten: formData.nebenkosten_vorauszahlung
          },
          werbungskosten: {
            schuldzinsen: formData.schuldzinsen,
            grundsteuer: formData.grundsteuer,
            versicherung: formData.gebaeudeversicherung,
            hausverwaltung: formData.hausverwaltung,
            instandhaltung: formData.instandhaltung,
            weitere: formData.weitere_kosten
          },
          berechnung: result,
          nutzer: user?.full_name
        },
        options: { has_watermark: false }
      });

      if (docResult.data) {
        setGeneratedDoc(docResult.data);
        toast.success('Anlage V erstellt!');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Anlage V (Steuererklärung)
          </h1>
          <p className="text-gray-600">
            Vermietungseinkünfte für die Steuererklärung
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={['Objekt', 'Einnahmen', 'Kosten', 'Ergebnis']} />

        {/* Schritt 1: Objekt */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 4: Objektdaten">
            <div className="space-y-4">
              <div>
                <Label>Steuerjahr</Label>
                <Input
                  type="number"
                  value={formData.steuerjahr}
                  onChange={(e) => updateFormData('steuerjahr', e.target.value)}
                  min="2020"
                />
              </div>

              <div>
                <Label>Adresse *</Label>
                <Input
                  value={formData.objekt_adresse}
                  onChange={(e) => updateFormData('objekt_adresse', e.target.value)}
                  placeholder="Musterstraße 10, 12345 Berlin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kaufpreis Gebäude (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.kaufpreis_gebaeude}
                    onChange={(e) => updateFormData('kaufpreis_gebaeude', e.target.value)}
                    placeholder="200000"
                  />
                </div>
                <div>
                  <Label>Gebäudeanteil (%)</Label>
                  <Input
                    type="number"
                    value={formData.gebaudeanteil_prozent}
                    onChange={(e) => updateFormData('gebaudeanteil_prozent', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Baujahr *</Label>
                <Input
                  type="number"
                  value={formData.baujahr}
                  onChange={(e) => updateFormData('baujahr', e.target.value)}
                  placeholder="1985"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Einnahmen */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Einnahmen">
            <div className="space-y-4">
              <div>
                <Label>Mieteinnahmen (jährlich) (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.mieteinnahmen_jährlich}
                  onChange={(e) => updateFormData('mieteinnahmen_jährlich', e.target.value)}
                  placeholder="10200"
                />
                <p className="text-xs text-gray-600 mt-1">z.B. 850€ × 12 Monate</p>
              </div>

              <div>
                <Label>Nebenkosten-Vorauszahlungen (jährlich) (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.nebenkosten_vorauszahlung}
                  onChange={(e) => updateFormData('nebenkosten_vorauszahlung', e.target.value)}
                  placeholder="2400"
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Werbungskosten */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Werbungskosten">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Schuldzinsen (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.schuldzinsen}
                    onChange={(e) => updateFormData('schuldzinsen', e.target.value)}
                    placeholder="4500"
                  />
                </div>
                <div>
                  <Label>Grundsteuer (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.grundsteuer}
                    onChange={(e) => updateFormData('grundsteuer', e.target.value)}
                    placeholder="487"
                  />
                </div>
                <div>
                  <Label>Gebäudeversicherung (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.gebaeudeversicherung}
                    onChange={(e) => updateFormData('gebaeudeversicherung', e.target.value)}
                    placeholder="320"
                  />
                </div>
                <div>
                  <Label>Hausverwaltung (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hausverwaltung}
                    onChange={(e) => updateFormData('hausverwaltung', e.target.value)}
                    placeholder="360"
                  />
                </div>
                <div>
                  <Label>Instandhaltung/Reparaturen (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.instandhaltung}
                    onChange={(e) => updateFormData('instandhaltung', e.target.value)}
                    placeholder="1250"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">Weitere Kosten</h4>
                  <Button onClick={addWerbungskosten} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Hinzufügen
                  </Button>
                </div>

                {formData.weitere_kosten.map((kosten, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Kostenart"
                      value={kosten.art}
                      onChange={(e) => updateWerbungskosten(idx, 'art', e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Betrag"
                      value={kosten.betrag}
                      onChange={(e) => updateWerbungskosten(idx, 'betrag', e.target.value)}
                      className="w-24"
                    />
                    <Button
                      onClick={() => removeWerbungskosten(idx)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Ergebnis */}
        {currentStep === 4 && (
          <FormSection title="Schritt 4 von 4: Ergebnis">
            {result && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
                  <h3 className="font-bold text-lg text-indigo-900 mb-4">Berechnung Anlage V</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded">
                      <span className="text-gray-700">Einnahmen gesamt:</span>
                      <span className="font-bold text-lg">{result.einnahmen.toFixed(2)} €</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded">
                      <span className="text-gray-700">Werbungskosten:</span>
                      <span className="font-bold text-lg text-red-600">-{result.werbungskosten.toFixed(2)} €</span>
                    </div>

                    <div className="text-xs text-gray-600 p-2 bg-white rounded">
                      davon AfA (Abschreibung): {result.jaehrliche_afa.toFixed(2)} €
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                      <span className="font-semibold text-green-900">Einkünfte aus V+V:</span>
                      <span className={`font-bold text-xl ${result.einkuenfte >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.einkuenfte.toFixed(2)} €
                      </span>
                    </div>

                    {result.einkuenfte < 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        💡 Negativer Betrag = Verlust = mindert Ihre Steuerlast um ca. {result.steuereinsparung.toFixed(2)} € 
                        (bei 42% Grenzsteuersatz)
                      </div>
                    )}
                  </div>
                </div>

                {!generatedDoc && (
                  <Button
                    onClick={generateDocument}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Erstelle PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Anlage V als PDF
                      </>
                    )}
                  </Button>
                )}

                {generatedDoc && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-semibold">✓ Anlage V erstellt!</p>
                    </div>
                    <Button
                      onClick={() => window.open(generatedDoc.document_url, '_blank')}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF herunterladen
                    </Button>
                  </div>
                )}
              </div>
            )}
          </FormSection>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
          >
            Zurück
          </Button>
          <Button
            onClick={nextStep}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {currentStep === 4 ? 'Fertig' : 'Weiter →'}
          </Button>
        </div>
      </div>
    </div>
  );
}