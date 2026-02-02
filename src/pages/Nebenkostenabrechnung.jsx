import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Plus, Trash2, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';
import ProgressSteps from '../components/wizard/ProgressSteps';

export default function Nebenkostenabrechnung() {
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
    wohnungen_anzahl: 1,
    gesamtwohnflaeche: '',
    
    // Mieter
    mieter_name: '',
    mieter_adresse: '',
    mieter_wohnflaeche: '',
    
    // Nebenkosten
    nebenkosten: [
      { art: 'Grundsteuer', betrag: '' },
      { art: 'Wasser/Abwasser', betrag: '' },
      { art: 'Heizung/Warmwasser', betrag: '' },
      { art: 'Müll/Straßenreinigung', betrag: '' },
      { art: 'Instandhaltung', betrag: '' },
      { art: 'Hausmeister/Reinigung', betrag: '' }
    ],
    
    // Vorauszahlungen
    vorauszahlungen_mtl: '',
    vorauszahlungen_anzahl_monate: 12,
    
    // Heizkostenverteilung
    heiz_nach_verbrauch: false,
    heiz_nach_flaeche: true,
    heiz_verbrauch_einheit: '',
    heiz_verbrauch_menge: ''
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

  const updateNebenkosten = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      nebenkosten: prev.nebenkosten.map((nk, i) =>
        i === index ? { ...nk, [field]: value } : nk
      )
    }));
  };

  const addNebenkosten = () => {
    setFormData(prev => ({
      ...prev,
      nebenkosten: [...prev.nebenkosten, { art: '', betrag: '' }]
    }));
  };

  const removeNebenkosten = (index) => {
    setFormData(prev => ({
      ...prev,
      nebenkosten: prev.nebenkosten.filter((_, i) => i !== index)
    }));
  };

  const calculateAbrechnung = () => {
    const gesamtwohnflaeche = parseFloat(formData.gesamtwohnflaeche) || 1;
    const mieter_wohnflaeche = parseFloat(formData.mieter_wohnflaeche) || 0;
    const flaechenquote = mieter_wohnflaeche / gesamtwohnflaeche;

    const gesamtnebenkosten = formData.nebenkosten.reduce((sum, nk) => sum + (parseFloat(nk.betrag) || 0), 0);
    const anteil_mieter = gesamtnebenkosten * flaechenquote;

    const vorauszahlungen_total = (parseFloat(formData.vorauszahlungen_mtl) || 0) * 
                                   (parseInt(formData.vorauszahlungen_anzahl_monate) || 12);
    const ausgleich = vorauszahlungen_total - anteil_mieter;

    setResult({
      gesamtnebenkosten,
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
      if (!formData.abrechnungsperiode_von || !formData.abrechnungsperiode_bis || !formData.objekt_adresse) {
        toast.error('Bitte Abrechnungsperiode und Objekt angeben');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.mieter_name || !formData.mieter_wohnflaeche) {
        toast.error('Bitte Mieterdaten angeben');
        return;
      }
    }
    if (currentStep === 3) {
      const hatNebenkosten = formData.nebenkosten.some(nk => parseFloat(nk.betrag) > 0);
      if (!hatNebenkosten) {
        toast.error('Bitte mindestens eine Nebenkostenposition angeben');
        return;
      }
      if (!formData.vorauszahlungen_mtl) {
        toast.error('Bitte monatliche Vorauszahlungen angeben');
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
        template_id: 'nebenkostenabrechnung',
        data: {
          abrechnungsperiode: {
            von: formData.abrechnungsperiode_von,
            bis: formData.abrechnungsperiode_bis
          },
          objekt: {
            adresse: formData.objekt_adresse,
            wohnungen_anzahl: formData.wohnungen_anzahl,
            gesamtwohnflaeche: formData.gesamtwohnflaeche
          },
          mieter: {
            name: formData.mieter_name,
            adresse: formData.mieter_adresse,
            wohnflaeche: formData.mieter_wohnflaeche
          },
          nebenkosten: formData.nebenkosten.filter(nk => parseFloat(nk.betrag) > 0),
          vorauszahlungen: {
            monatlich: formData.vorauszahlungen_mtl,
            anzahl_monate: formData.vorauszahlungen_anzahl_monate
          },
          berechnung: result,
          nutzer: user?.full_name
        }
      });

      if (docResult.data) {
        setGeneratedDoc(docResult.data);
        toast.success('Nebenkostenabrechnung erstellt!');
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
            📊 Nebenkostenabrechnung
          </h1>
          <p className="text-gray-600">
            Transparente Nebenkostenabrechnung für Mieter
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={['Zeitraum', 'Mieter', 'Kosten', 'Ergebnis']} />

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
                  <Label>Abrechnungsperiode bis *</Label>
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
                  placeholder="Musterstraße 10, 12345 Berlin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Anzahl Wohnungen</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.wohnungen_anzahl}
                    onChange={(e) => updateFormData('wohnungen_anzahl', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Gesamtwohnfläche (m²)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.gesamtwohnflaeche}
                    onChange={(e) => updateFormData('gesamtwohnflaeche', e.target.value)}
                    placeholder="250"
                  />
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title="Schritt 2: Mieter">
            <div className="space-y-4">
              <div>
                <Label>Name des Mieters *</Label>
                <Input
                  value={formData.mieter_name}
                  onChange={(e) => updateFormData('mieter_name', e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <Label>Mietwohnung Adresse</Label>
                <Input
                  value={formData.mieter_adresse}
                  onChange={(e) => updateFormData('mieter_adresse', e.target.value)}
                  placeholder="Musterstraße 10, 3OG links, 12345 Berlin"
                />
              </div>

              <div>
                <Label>Wohnfläche Mietwohnung (m²) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.mieter_wohnflaeche}
                  onChange={(e) => updateFormData('mieter_wohnflaeche', e.target.value)}
                  placeholder="75"
                />
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 3 && (
          <FormSection title="Schritt 3: Nebenkosten">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Nebenkostenpositionen</h4>
                  <Button onClick={addNebenkosten} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Position
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.nebenkosten.map((nk, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Kostenart"
                        value={nk.art}
                        onChange={(e) => updateNebenkosten(idx, 'art', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="€"
                        value={nk.betrag}
                        onChange={(e) => updateNebenkosten(idx, 'betrag', e.target.value)}
                        className="w-32"
                      />
                      {formData.nebenkosten.length > 1 && (
                        <Button
                          onClick={() => removeNebenkosten(idx)}
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

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Vorauszahlungen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Monatliche Vorauszahlung (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.vorauszahlungen_mtl}
                      onChange={(e) => updateFormData('vorauszahlungen_mtl', e.target.value)}
                      placeholder="180"
                    />
                  </div>
                  <div>
                    <Label>Anzahl Monate</Label>
                    <Input
                      type="number"
                      value={formData.vorauszahlungen_anzahl_monate}
                      onChange={(e) => updateFormData('vorauszahlungen_anzahl_monate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 4 && result && (
          <FormSection title="Schritt 4: Abrechnung">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
                <h3 className="font-bold text-lg text-indigo-900 mb-4">Berechnungsübersicht</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded">
                    <span>Gesamtnebenkosten:</span>
                    <span className="font-bold">{parseFloat(result.gesamtnebenkosten).toFixed(2)} €</span>
                  </div>

                  <div className="flex justify-between p-3 bg-white rounded text-sm">
                    <span>Flächenquote:</span>
                    <span className="font-bold">{result.flaechenquote}%</span>
                  </div>

                  <div className="flex justify-between p-3 bg-white rounded">
                    <span>Anteil Mieter:</span>
                    <span className="font-bold text-indigo-600">{result.anteil_mieter} €</span>
                  </div>

                  <div className="flex justify-between p-3 bg-white rounded">
                    <span>Vorauszahlungen:</span>
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