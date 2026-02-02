import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';
import ProgressSteps from '../components/wizard/ProgressSteps';

export default function MaklercourtageVertrag() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    vermieter_name: '',
    vermieter_adresse: '',
    makler_name: '',
    makler_adresse: '',
    makler_telefon: '',
    makler_email: '',
    courtage_prozent: 2.38,
    auf_seite: 'mieter', // mieter oder beide
    objekt_adresse: '',
    objekt_wohnflaeche: '',
    objekt_zimmer: '',
    kaltmiete: '',
    nebenkosten: '',
    vertrag_gueltig_ab: '',
    erfolgshonorar: true,
    provision_inkl_mwst: true
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
      if (!formData.vermieter_name || !formData.makler_name) {
        toast.error('Bitte Vermieter und Makler angeben');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.objekt_adresse || !formData.kaltmiete) {
        toast.error('Bitte Objektdaten angeben');
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
        template_id: 'maklercourtage_vertrag',
        data: {
          vermieter: {
            name: formData.vermieter_name,
            adresse: formData.vermieter_adresse
          },
          makler: {
            name: formData.makler_name,
            adresse: formData.makler_adresse,
            telefon: formData.makler_telefon,
            email: formData.makler_email
          },
          objekt: {
            adresse: formData.objekt_adresse,
            wohnflaeche: formData.objekt_wohnflaeche,
            zimmer: formData.objekt_zimmer,
            kaltmiete: formData.kaltmiete,
            nebenkosten: formData.nebenkosten
          },
          courtage: {
            prozent: formData.courtage_prozent,
            auf_seite: formData.auf_seite,
            erfolgshonorar: formData.erfolgshonorar,
            inkl_mwst: formData.provision_inkl_mwst
          },
          gueltig_ab: formData.vertrag_gueltig_ab,
          datum: new Date().toISOString().split('T')[0]
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Maklercourtage-Vertrag erstellt!');
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💼 Maklercourtage-Vereinbarung
          </h1>
          <p className="text-gray-600">
            Maklervertrag für Vermietung
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={['Parteien', 'Objekt', 'Konditionen', 'Export']} />

        {currentStep === 1 && (
          <FormSection title="Schritt 1: Parteien">
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
                <h4 className="font-semibold mb-3">Makler/Vermittler</h4>
                <div className="space-y-2">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.makler_name}
                      onChange={(e) => updateFormData('makler_name', e.target.value)}
                      placeholder="Makler GmbH"
                    />
                  </div>
                  <div>
                    <Label>Anschrift</Label>
                    <Input
                      value={formData.makler_adresse}
                      onChange={(e) => updateFormData('makler_adresse', e.target.value)}
                      placeholder="Maklerweg 1, 12345 Berlin"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        value={formData.makler_telefon}
                        onChange={(e) => updateFormData('makler_telefon', e.target.value)}
                        placeholder="030 12345678"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.makler_email}
                        onChange={(e) => updateFormData('makler_email', e.target.value)}
                        placeholder="kontakt@makler.de"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title="Schritt 2: Objektdaten">
            <div className="space-y-4">
              <div>
                <Label>Objektadresse *</Label>
                <Input
                  value={formData.objekt_adresse}
                  onChange={(e) => updateFormData('objekt_adresse', e.target.value)}
                  placeholder="Musterstraße 10, 12345 Berlin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Wohnfläche (m²)</Label>
                  <Input
                    type="number"
                    value={formData.objekt_wohnflaeche}
                    onChange={(e) => updateFormData('objekt_wohnflaeche', e.target.value)}
                    placeholder="75"
                  />
                </div>
                <div>
                  <Label>Zimmer</Label>
                  <Input
                    type="number"
                    value={formData.objekt_zimmer}
                    onChange={(e) => updateFormData('objekt_zimmer', e.target.value)}
                    placeholder="3"
                  />
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
            </div>
          </FormSection>
        )}

        {currentStep === 3 && (
          <FormSection title="Schritt 3: Konditionen">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Courtage-Satz (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.courtage_prozent}
                    onChange={(e) => updateFormData('courtage_prozent', e.target.value)}
                  />
                  <p className="text-xs text-gray-600 mt-1">Standard: 2,38% + MwSt</p>
                </div>
              </div>

              <div>
                <Label>Courtage trägt</Label>
                <select
                  value={formData.auf_seite}
                  onChange={(e) => updateFormData('auf_seite', e.target.value)}
                  className="w-full rounded border p-2"
                >
                  <option value="mieter">Mieter alleine</option>
                  <option value="vermieter">Vermieter alleine</option>
                  <option value="beide">Beide je zur Hälfte</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.erfolgshonorar}
                    onChange={(e) => updateFormData('erfolgshonorar', e.target.checked)}
                  />
                  <span className="text-sm">Provisionen sind Erfolgshonorare (nur bei erfolgreicher Vermittlung)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.provision_inkl_mwst}
                    onChange={(e) => updateFormData('provision_inkl_mwst', e.target.checked)}
                  />
                  <span className="text-sm">Provisionen inkl. MwSt</span>
                </label>
              </div>

              <div>
                <Label>Vertrag gültig ab</Label>
                <Input
                  type="date"
                  value={formData.vertrag_gueltig_ab}
                  onChange={(e) => updateFormData('vertrag_gueltig_ab', e.target.value)}
                />
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 4 && (
          <FormSection title="Schritt 4: Export">
            {!generatedDoc ? (
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
                    Vertrag erstellen
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">✓ Vertrag erstellt!</p>
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