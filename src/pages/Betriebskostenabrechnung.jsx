import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Plus, Trash2, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';
import ProgressSteps from '../components/wizard/ProgressSteps';

export default function Betriebskostenabrechnung() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    // Allgemein
    abrechnungsperiode_von: '',
    abrechnungsperiode_bis: '',
    
    // Objekt
    objekt_adresse: '',
    gesamtwohnflaeche: '',
    
    // Betriebskosten
    betriebskosten: [
      { art: 'Verwaltungskosten', betrag: '', umlage: 'qm' },
      { art: 'Hausmeister', betrag: '', umlage: 'qm' },
      { art: 'Reinigung', betrag: '', umlage: 'qm' },
      { art: 'Instandhaltung', betrag: '', umlage: 'qm' },
      { art: 'Versicherungen', betrag: '', umlage: 'qm' }
    ],

    // Mieter
    mieter_name: '',
    mieter_wohnflaeche: '',
    mieter_vorauszahlung_mtl: '',
    mieter_vorauszahlung_monate: 12
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

  const updateBetriebskosten = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      betriebskosten: prev.betriebskosten.map((bk, i) =>
        i === index ? { ...bk, [field]: value } : bk
      )
    }));
  };

  const addBetriebskosten = () => {
    setFormData(prev => ({
      ...prev,
      betriebskosten: [...prev.betriebskosten, { art: '', betrag: '', umlage: 'qm' }]
    }));
  };

  const removeBetriebskosten = (index) => {
    setFormData(prev => ({
      ...prev,
      betriebskosten: prev.betriebskosten.filter((_, i) => i !== index)
    }));
  };

  const calculateAbrechnung = () => {
    const gesamtwohnflaeche = parseFloat(formData.gesamtwohnflaeche) || 1;
    const mieter_wohnflaeche = parseFloat(formData.mieter_wohnflaeche) || 0;
    const flaechenquote = mieter_wohnflaeche / gesamtwohnflaeche;

    const gesamtbetriebskosten = formData.betriebskosten.reduce((sum, bk) => 
      sum + (parseFloat(bk.betrag) || 0), 0);
    const anteil_mieter = gesamtbetriebskosten * flaechenquote;

    const vorauszahlungen_total = (parseFloat(formData.mieter_vorauszahlung_mtl) || 0) * 
                                   (parseInt(formData.mieter_vorauszahlung_monate) || 12);
    const ausgleich = vorauszahlungen_total - anteil_mieter;

    setResult({
      gesamtbetriebskosten,
      flaechenquote: (flaechenquote * 100).toFixed(2),
      anteil_mieter: anteil_mieter.toFixed(2),
      vorauszahlungen_total: vorauszahlungen_total.toFixed(2),
      ausgleich: ausgleich.toFixed(2),
      ausgleich_nachzahlung: ausgleich < 0 ? Math.abs(ausgleich).toFixed(2) : null,
      ausgleich_gutschrift: ausgleich > 0 ? ausgleich.toFixed(2) : null
    });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.abrechnungsperiode_von || !formData.objekt_adresse) {
        toast.error('Bitte Zeitraum und Objekt angeben');
        return;
      }
    }
    if (currentStep === 2) {
      const hatBetriebskosten = formData.betriebskosten.some(bk => parseFloat(bk.betrag) > 0);
      if (!hatBetriebskosten) {
        toast.error('Bitte mindestens eine Position angeben');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.mieter_name || !formData.mieter_wohnflaeche || !formData.mieter_vorauszahlung_mtl) {
        toast.error('Bitte Mieterdaten angeben');
        return;
      }
      calculateAbrechnung();
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
        template_id: 'betriebskostenabrechnung',
        data: {
          abrechnungsperiode: {
            von: formData.abrechnungsperiode_von,
            bis: formData.abrechnungsperiode_bis
          },
          objekt: {
            adresse: formData.objekt_adresse,
            gesamtwohnflaeche: formData.gesamtwohnflaeche
          },
          betriebskosten: formData.betriebskosten.filter(bk => parseFloat(bk.betrag) > 0),
          mieter: {
            name: formData.mieter_name,
            wohnflaeche: formData.mieter_wohnflaeche
          },
          vorauszahlungen: {
            monatlich: formData.mieter_vorauszahlung_mtl,
            monate: formData.mieter_vorauszahlung_monate
          },
          berechnung: result,
          nutzer: user?.full_name
        }
      });

      if (docResult.data) {
        setGeneratedDoc(docResult.data);
        toast.success('Betriebskostenabrechnung erstellt!');
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
            📋 Betriebskostenabrechnung
          </h1>
          <p className="text-gray-600">
            Betriebskosten für gewerbliche Flächen abrechnen
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={['Zeitraum', 'Kosten', 'Mieter', 'Export']} />

        {currentStep === 1 && (
          <FormSection title="Schritt 1: Abrechnungsperiode">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Abrechnungsperiode von *</Label>
                  <Input
                    type="date"
                    value={formData.abrechnungsperiode_von}
                    onChange={(e) => updateFormData('abrechnungsperiode_von', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Abrechnungsperiode bis</Label>
                  <Input
                    type="date"
                    value={formData.abrechnungsperiode_bis}
                    onChange={(e) => updateFormData('abrechnungsperiode_bis', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Objektadresse *</Label>
                <Input
                  value={formData.objekt_adresse}
                  onChange={(e) => updateFormData('objekt_adresse', e.target.value)}
                  placeholder="Gewerbestraße 1, 12345 Berlin"
                />
              </div>

              <div>
                <Label>Gesamtnutzfläche (m²)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.gesamtwohnflaeche}
                  onChange={(e) => updateFormData('gesamtwohnflaeche', e.target.value)}
                  placeholder="500"
                />
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title="Schritt 2: Betriebskosten">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Betriebskostenpositionen</h4>
                <Button onClick={addBetriebskosten} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Position
                </Button>
              </div>

              <div className="space-y-2">
                {formData.betriebskosten.map((bk, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Kostenart"
                      value={bk.art}
                      onChange={(e) => updateBetriebskosten(idx, 'art', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="€"
                      value={bk.betrag}
                      onChange={(e) => updateBetriebskosten(idx, 'betrag', e.target.value)}
                      className="w-32"
                    />
                    <select
                      value={bk.umlage}
                      onChange={(e) => updateBetriebskosten(idx, 'umlage', e.target.value)}
                      className="rounded border p-2 text-sm"
                    >
                      <option value="qm">nach m²</option>
                      <option value="mieter">pro Mieter</option>
                    </select>
                    {formData.betriebskosten.length > 1 && (
                      <Button
                        onClick={() => removeBetriebskosten(idx)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 3 && (
          <FormSection title="Schritt 3: Mieter">
            <div className="space-y-4">
              <div>
                <Label>Name des Mieters *</Label>
                <Input
                  value={formData.mieter_name}
                  onChange={(e) => updateFormData('mieter_name', e.target.value)}
                  placeholder="Musterfirma GmbH"
                />
              </div>

              <div>
                <Label>Nutzfläche Mieter (m²) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.mieter_wohnflaeche}
                  onChange={(e) => updateFormData('mieter_wohnflaeche', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Vorauszahlung (€/Monat) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.mieter_vorauszahlung_mtl}
                    onChange={(e) => updateFormData('mieter_vorauszahlung_mtl', e.target.value)}
                    placeholder="300"
                  />
                </div>
                <div>
                  <Label>Abrechuung für (Monate)</Label>
                  <Input
                    type="number"
                    value={formData.mieter_vorauszahlung_monate}
                    onChange={(e) => updateFormData('mieter_vorauszahlung_monate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 4 && result && (
          <FormSection title="Schritt 4: Abrechnung">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="font-bold text-lg text-purple-900 mb-4">Betriebskostenabrechnung</h3>

                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded">
                    <span>Gesamtbetriebskosten:</span>
                    <span className="font-bold">{parseFloat(result.gesamtbetriebskosten).toFixed(2)} €</span>
                  </div>

                  <div className="flex justify-between p-3 bg-white rounded text-sm">
                    <span>Flächenquote:</span>
                    <span className="font-bold">{result.flaechenquote}%</span>
                  </div>

                  <div className="flex justify-between p-3 bg-white rounded">
                    <span>Anteil Mieter:</span>
                    <span className="font-bold text-purple-600">{result.anteil_mieter} €</span>
                  </div>

                  <div className="flex justify-between p-3 bg-white rounded">
                    <span>Vorauszahlungen gesamt:</span>
                    <span className="font-bold">{result.vorauszahlungen_total} €</span>
                  </div>

                  <div className={`flex justify-between p-3 rounded-lg font-bold text-lg ${
                    result.ausgleich_nachzahlung
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <span>{result.ausgleich_nachzahlung ? 'Nachzahlung:' : 'Gutschrift:'}</span>
                    <span>{result.ausgleich_nachzahlung || result.ausgleich_gutschrift} €</span>
                  </div>
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
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Abrechnung erstellen
                    </>
                  )}
                </Button>
              )}

              {generatedDoc && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold">✓ Abrechnung erstellt!</p>
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
          </FormSection>
        )}

        <div className="flex justify-between mt-8">
          <Button onClick={prevStep} disabled={currentStep === 1} variant="outline">
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