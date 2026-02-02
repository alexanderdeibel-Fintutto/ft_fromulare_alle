import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';
import ProgressSteps from '../components/wizard/ProgressSteps';

export default function MietvertragTemplate() {
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
    mieter_geb_datum: '',
    mieter_adresse: '',
    mieter_telefon: '',
    mieter_email: '',
    
    // Objekt
    objekt_adresse: '',
    objekt_etage: '',
    wohnflaeche: '',
    zimmer: '',
    nutzung: 'wohnung', // wohnung, gewerbe, parkplatz
    
    // Mietbedingungen
    mietbeginn: '',
    mietende: '',
    mietdauer_unbegrenzt: true,
    kaltmiete: '',
    nebenkosten: '',
    kaution_betrag: '',
    makler_courtage: false,
    makler_betrag: '',
    
    // Besonderheiten
    haustiere: false,
    haustiere_text: '',
    moebel: false,
    kuendigung_frist_wochen: 3,
    nebenkosten_abrechnung_yearly: true,
    
    // Vertragsklauseln
    klauseln: {
      schoenheitsreparaturen: true,
      reinigung_uebergabe: true,
      zahlungsrueckstand: true,
      versicherung: true,
      renovierung: true
    }
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

  const toggleKlausel = (klausel) => {
    setFormData(prev => ({
      ...prev,
      klauseln: {
        ...prev.klauseln,
        [klausel]: !prev.klauseln[klausel]
      }
    }));
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
        toast.error('Bitte Objektdaten und Mietbeginn angeben');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.kaltmiete) {
        toast.error('Bitte Miete angeben');
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
        template_id: 'mietvertrag',
        data: {
          vermieter: {
            name: formData.vermieter_name,
            adresse: formData.vermieter_adresse
          },
          mieter: {
            name: formData.mieter_name,
            geb_datum: formData.mieter_geb_datum,
            adresse: formData.mieter_adresse,
            telefon: formData.mieter_telefon,
            email: formData.mieter_email
          },
          objekt: {
            adresse: formData.objekt_adresse,
            etage: formData.objekt_etage,
            wohnflaeche: formData.wohnflaeche,
            zimmer: formData.zimmer,
            nutzung: formData.nutzung
          },
          miete: {
            kaltmiete: formData.kaltmiete,
            nebenkosten: formData.nebenkosten,
            kaution: formData.kaution_betrag,
            mietbeginn: formData.mietbeginn,
            mietende: formData.mietende_unbegrenzt ? null : formData.mietende,
            unbegrenzt: formData.mietdauer_unbegrenzt,
            kuendigung_frist_wochen: formData.kuendigung_frist_wochen,
            abrechnung_yearly: formData.nebenkosten_abrechnung_yearly
          },
          besonderheiten: {
            haustiere: formData.haustiere,
            haustiere_text: formData.haustiere_text,
            moebel: formData.moebel
          },
          makler: formData.makler_courtage ? {
            ja: true,
            betrag: formData.makler_betrag
          } : null,
          klauseln: formData.klauseln,
          datum: new Date().toISOString().split('T')[0]
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Mietvertrag erstellt!');
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
            📄 Mietvertrag Generator
          </h1>
          <p className="text-gray-600">
            Rechtssicherer Mietvertrag nach deutschem Mietrecht
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={['Parteien', 'Objekt', 'Miete', 'Klauseln']} />

        {currentStep === 1 && (
          <FormSection title="Schritt 1: Vermieter & Mieter">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Vermieter</h4>
                <div className="space-y-2">
                  <div>
                    <Label>Name *</Label>
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
                      placeholder="Vermieterweg 1, 12345 Berlin"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Mieter</h4>
                <div className="space-y-2">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.mieter_name}
                      onChange={(e) => updateFormData('mieter_name', e.target.value)}
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div>
                    <Label>Geburtsdatum</Label>
                    <Input
                      type="date"
                      value={formData.mieter_geb_datum}
                      onChange={(e) => updateFormData('mieter_geb_datum', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Anschrift (aktuell)</Label>
                    <Input
                      value={formData.mieter_adresse}
                      onChange={(e) => updateFormData('mieter_adresse', e.target.value)}
                      placeholder="Mietweg 5, 54321 München"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        value={formData.mieter_telefon}
                        onChange={(e) => updateFormData('mieter_telefon', e.target.value)}
                        placeholder="030 12345678"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.mieter_email}
                        onChange={(e) => updateFormData('mieter_email', e.target.value)}
                        placeholder="max@example.de"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title="Schritt 2: Wohnobjekt">
            <div className="space-y-4">
              <div>
                <Label>Komplette Adresse *</Label>
                <Input
                  value={formData.objekt_adresse}
                  onChange={(e) => updateFormData('objekt_adresse', e.target.value)}
                  placeholder="Musterstraße 10, 3OG links, 12345 Berlin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Etage</Label>
                  <Input
                    value={formData.objekt_etage}
                    onChange={(e) => updateFormData('objekt_etage', e.target.value)}
                    placeholder="3. OG"
                  />
                </div>
                <div>
                  <Label>Wohnfläche (m²)</Label>
                  <Input
                    type="number"
                    value={formData.wohnflaeche}
                    onChange={(e) => updateFormData('wohnflaeche', e.target.value)}
                    placeholder="75"
                  />
                </div>
                <div>
                  <Label>Zimmer</Label>
                  <Input
                    type="number"
                    value={formData.zimmer}
                    onChange={(e) => updateFormData('zimmer', e.target.value)}
                    placeholder="3"
                  />
                </div>
              </div>

              <div>
                <Label>Nutzung</Label>
                <select
                  value={formData.nutzung}
                  onChange={(e) => updateFormData('nutzung', e.target.value)}
                  className="w-full rounded border p-2"
                >
                  <option value="wohnung">Wohnung</option>
                  <option value="gewerbe">Gewerberäume</option>
                  <option value="parkplatz">Parkplatz</option>
                </select>
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 3 && (
          <FormSection title="Schritt 3: Mietbedingungen">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Mietbeginn *</Label>
                  <Input
                    type="date"
                    value={formData.mietbeginn}
                    onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.mietdauer_unbegrenzt}
                      onCheckedChange={(e) => updateFormData('mietdauer_unbegrenzt', e)}
                    />
                    <span className="text-sm">Unbegrenztes Mietverhältnis</span>
                  </label>
                  {!formData.mietdauer_unbegrenzt && (
                    <Input
                      type="date"
                      value={formData.mietende}
                      onChange={(e) => updateFormData('mietende', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kaltmiete (€/Monat) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.kaltmiete}
                    onChange={(e) => updateFormData('kaltmiete', e.target.value)}
                    placeholder="1050"
                  />
                </div>
                <div>
                  <Label>Nebenkosten (€/Monat)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.nebenkosten}
                    onChange={(e) => updateFormData('nebenkosten', e.target.value)}
                    placeholder="200"
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
                    placeholder="2100"
                  />
                </div>
                <div>
                  <Label>Kündigungsfrist (Wochen)</Label>
                  <Input
                    type="number"
                    value={formData.kuendigung_frist_wochen}
                    onChange={(e) => updateFormData('kuendigung_frist_wochen', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.makler_courtage}
                    onCheckedChange={(e) => updateFormData('makler_courtage', e)}
                  />
                  <span className="text-sm">Maklergebühr fällig</span>
                </label>
                {formData.makler_courtage && (
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Maklergebühr in €"
                    value={formData.makler_betrag}
                    onChange={(e) => updateFormData('makler_betrag', e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.haustiere}
                    onCheckedChange={(e) => updateFormData('haustiere', e)}
                  />
                  <span className="text-sm">Haustiere erlaubt</span>
                </label>
                {formData.haustiere && (
                  <Input
                    placeholder="z.B. max. 1 Katze"
                    value={formData.haustiere_text}
                    onChange={(e) => updateFormData('haustiere_text', e.target.value)}
                  />
                )}
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 4 && (
          <FormSection title="Schritt 4: Vertragsklauseln">
            <div className="space-y-3">
              {Object.entries(formData.klauseln).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                  <Checkbox
                    checked={value}
                    onCheckedChange={() => toggleKlausel(key)}
                  />
                  <div>
                    <div className="font-semibold text-sm">
                      {key === 'schoenheitsreparaturen' && 'Schönheitsreparaturen'}
                      {key === 'reinigung_uebergabe' && 'Reinigung bei Übergabe'}
                      {key === 'zahlungsrueckstand' && 'Zahlungsrückstand'}
                      {key === 'versicherung' && 'Versicherung'}
                      {key === 'renovierung' && 'Renovierungsverbot'}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {key === 'schoenheitsreparaturen' && 'Mieter trägt Schönheitsreparaturen'}
                      {key === 'reinigung_uebergabe' && 'Übergabe der Wohnung in gereinigtem Zustand'}
                      {key === 'zahlungsrueckstand' && 'Vertrag kündbar bei Zahlungsrückstand'}
                      {key === 'versicherung' && 'Mieter versichert die Inneneinrichtung'}
                      {key === 'renovierung' && 'Mieter darf nicht eigenständig renovieren'}
                    </p>
                  </div>
                </label>
              ))}

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
                      Mietvertrag erstellen
                    </>
                  )}
                </Button>
              )}

              {generatedDoc && (
                <div className="space-y-3 mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold">✓ Mietvertrag erstellt!</p>
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