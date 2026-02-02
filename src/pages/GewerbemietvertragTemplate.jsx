import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';
import ProgressSteps from '../components/wizard/ProgressSteps';

export default function GewerbemietvertragTemplate() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Vermieter
    vermieter_name: '',
    vermieter_adresse: '',
    
    // Mieter
    mieter_name: '',
    mieter_unternehmensform: 'einzelunternehmen', // einzelunternehmen, gmbh, ag
    mieter_geschaeftsfuehrer: '',
    mieter_adresse: '',
    
    // Objekt
    objekt_adresse: '',
    objekt_art: 'buero', // buero, lager, einzelhandel, gastronomie, industrie
    nutzflaeche: '',
    
    // Mietbedingungen
    mietbeginn: '',
    mietende: '',
    mietdauer_unbegrenzt: true,
    grundmiete: '',
    nebenkosten: '',
    betriebskosten: '',
    kaution_betrag: '',
    kaution_monate: 3,
    
    // Gewerbespezifisch
    nutzungszweck: '',
    verkehrsstaerkung: 0, // Prozent Mietsteigerung
    staffelung: false,
    staffelmiete: [],
    
    // Besonderheiten
    versicherung_mieter: true,
    renovierung_schoenheit: false,
    auslaendische_mahlstaebe: false
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      updateFormData('vermieter_name', currentUser.full_name || '');
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.vermieter_name || !formData.mieter_name) {
        toast.error('Bitte Vermieter und Mieter angeben');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.objekt_adresse || !formData.mietbeginn) {
        toast.error('Bitte Objektadresse und Mietbeginn angeben');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.grundmiete) {
        toast.error('Bitte Grundmiete angeben');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generateDocument = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'gewerbemietvertrag',
        data: {
          vermieter: {
            name: formData.vermieter_name,
            adresse: formData.vermieter_adresse
          },
          mieter: {
            name: formData.mieter_name,
            unternehmensform: formData.mieter_unternehmensform,
            geschaeftsfuehrer: formData.mieter_geschaeftsfuehrer,
            adresse: formData.mieter_adresse
          },
          objekt: {
            adresse: formData.objekt_adresse,
            art: formData.objekt_art,
            nutzflaeche: formData.nutzflaeche,
            nutzungszweck: formData.nutzungszweck
          },
          miete: {
            grundmiete: formData.grundmiete,
            nebenkosten: formData.nebenkosten,
            betriebskosten: formData.betriebskosten,
            kaution: {
              betrag: formData.kaution_betrag,
              monate: formData.kaution_monate
            },
            mietbeginn: formData.mietbeginn,
            mietende: formData.mietdauer_unbegrenzt ? null : formData.mietende,
            unbegrenzt: formData.mietdauer_unbegrenzt,
            mietsteigerung: formData.verkehrsstaerkung,
            staffelmiete: formData.staffelung
          },
          besonderheiten: {
            versicherung: formData.versicherung_mieter,
            renovierung: formData.renovierung_schoenheit,
            auslaendische_mahlstaebe: formData.auslaendische_mahlstaebe
          },
          datum: new Date().toISOString().split('T')[0]
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Gewerbemietvertrag erstellt!');
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
            💼 Gewerbemietvertrag Generator
          </h1>
          <p className="text-gray-600">
            Professioneller Gewerbemietvertrag für Büro, Laden & Lagerflächen
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={['Parteien', 'Objekt', 'Miete', 'Klauseln']} />

        {currentStep === 1 && (
          <FormSection title="Schritt 1: Parteien">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Vermieter (Vermieterin)</h4>
                <div className="space-y-2">
                  <div>
                    <Label>Name/Firma *</Label>
                    <Input
                      value={formData.vermieter_name}
                      onChange={(e) => updateFormData('vermieter_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Anschrift</Label>
                    <Input
                      value={formData.vermieter_adresse}
                      onChange={(e) => updateFormData('vermieter_adresse', e.target.value)}
                      placeholder="Vermietweg 1, 12345 Berlin"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Mieter (Mieterin)</h4>
                <div className="space-y-2">
                  <div>
                    <Label>Name/Firma *</Label>
                    <Input
                      value={formData.mieter_name}
                      onChange={(e) => updateFormData('mieter_name', e.target.value)}
                      placeholder="Musterfirma GmbH"
                    />
                  </div>

                  <div>
                    <Label>Unternehmensform</Label>
                    <select
                      value={formData.mieter_unternehmensform}
                      onChange={(e) => updateFormData('mieter_unternehmensform', e.target.value)}
                      className="w-full rounded border p-2"
                    >
                      <option value="einzelunternehmen">Einzelunternehmen</option>
                      <option value="gmbh">GmbH</option>
                      <option value="ag">AG</option>
                      <option value="partnership">Partnerschaft</option>
                      <option value="andere">Andere</option>
                    </select>
                  </div>

                  <div>
                    <Label>Geschäftsführer/Vertreter</Label>
                    <Input
                      value={formData.mieter_geschaeftsfuehrer}
                      onChange={(e) => updateFormData('mieter_geschaeftsfuehrer', e.target.value)}
                      placeholder="Max Beispiel"
                    />
                  </div>

                  <div>
                    <Label>Anschrift</Label>
                    <Input
                      value={formData.mieter_adresse}
                      onChange={(e) => updateFormData('mieter_adresse', e.target.value)}
                      placeholder="Geschäftsweg 5, 54321 München"
                    />
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title="Schritt 2: Gewerbeobjekt">
            <div className="space-y-4">
              <div>
                <Label>Komplette Adresse *</Label>
                <Input
                  value={formData.objekt_adresse}
                  onChange={(e) => updateFormData('objekt_adresse', e.target.value)}
                  placeholder="Gewerbestraße 10, 12345 Berlin"
                />
              </div>

              <div>
                <Label>Art der Gewerbefläche</Label>
                <select
                  value={formData.objekt_art}
                  onChange={(e) => updateFormData('objekt_art', e.target.value)}
                  className="w-full rounded border p-2"
                >
                  <option value="buero">Bürofläche</option>
                  <option value="lager">Lagerfläche</option>
                  <option value="einzelhandel">Einzelhandelsfläche</option>
                  <option value="gastronomie">Gastronomiefläche</option>
                  <option value="industrie">Produktionsfläche</option>
                  <option value="sonstiges">Sonstige</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nutzfläche (m²)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.nutzflaeche}
                    onChange={(e) => updateFormData('nutzflaeche', e.target.value)}
                    placeholder="250"
                  />
                </div>
                <div>
                  <Label>Mietbeginn *</Label>
                  <Input
                    type="date"
                    value={formData.mietbeginn}
                    onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Nutzungszweck</Label>
                <Input
                  value={formData.nutzungszweck}
                  onChange={(e) => updateFormData('nutzungszweck', e.target.value)}
                  placeholder="z.B. Verwaltungsbüro für Immobilienverwaltung"
                />
              </div>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.mietdauer_unbegrenzt}
                  onCheckedChange={(e) => updateFormData('mietdauer_unbegrenzt', e)}
                />
                <span className="text-sm">Unbegrenzte Mietdauer</span>
              </label>
              {!formData.mietdauer_unbegrenzt && (
                <Input
                  type="date"
                  value={formData.mietende}
                  onChange={(e) => updateFormData('mietende', e.target.value)}
                  placeholder="Mietende"
                />
              )}
            </div>
          </FormSection>
        )}

        {currentStep === 3 && (
          <FormSection title="Schritt 3: Mietbedingungen">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Grundmiete (€/Monat) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.grundmiete}
                    onChange={(e) => updateFormData('grundmiete', e.target.value)}
                    placeholder="3000"
                  />
                </div>
                <div>
                  <Label>Nebenkosten (€/Monat)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.nebenkosten}
                    onChange={(e) => updateFormData('nebenkosten', e.target.value)}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label>Betriebskosten (€/Monat)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.betriebskosten}
                    onChange={(e) => updateFormData('betriebskosten', e.target.value)}
                    placeholder="800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kaution (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.kaution_betrag}
                    onChange={(e) => updateFormData('kaution_betrag', e.target.value)}
                    placeholder="9000"
                  />
                </div>
                <div>
                  <Label>Kautionshöhe (Monate)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.kaution_monate}
                    onChange={(e) => updateFormData('kaution_monate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Mietsteigerung (% jährlich)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.verkehrsstaerkung}
                  onChange={(e) => updateFormData('verkehrsstaerkung', e.target.value)}
                  placeholder="2"
                />
                <p className="text-xs text-gray-600 mt-1">z.B. 2% Mietsteigerung pro Jahr</p>
              </div>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.staffelung}
                  onCheckedChange={(e) => updateFormData('staffelung', e)}
                />
                <span className="text-sm">Staffelmiete (statt prozentuale Steigerung)</span>
              </label>
            </div>
          </FormSection>
        )}

        {currentStep === 4 && (
          <FormSection title="Schritt 4: Klauseln & Export">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.versicherung_mieter}
                    onCheckedChange={(e) => updateFormData('versicherung_mieter', e)}
                  />
                  <span className="text-sm">Mieter versichert Betriebseinrichtung</span>
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.renovierung_schoenheit}
                    onCheckedChange={(e) => updateFormData('renovierung_schoenheit', e)}
                  />
                  <span className="text-sm">Schönheitsreparaturen gehören zum Mieter</span>
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.auslaendische_mahlstaebe}
                    onCheckedChange={(e) => updateFormData('auslaendische_mahlstaebe', e)}
                  />
                  <span className="text-sm">Ausländische Maßstäbe erlaubt</span>
                </label>
              </div>

              {!generatedDoc && (
                <Button
                  onClick={generateDocument}
                  disabled={loading}
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700"
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
                      Gewerbemietvertrag erstellen
                    </>
                  )}
                </Button>
              )}

              {generatedDoc && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold">✓ Gewerbemietvertrag erstellt!</p>
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