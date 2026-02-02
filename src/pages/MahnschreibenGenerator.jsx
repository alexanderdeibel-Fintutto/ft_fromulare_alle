import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, FileText, AlertTriangle } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';
import ProgressSteps from '../components/wizard/ProgressSteps';

export default function MahnschreibenGenerator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Parteien
    vermieter_name: '',
    vermieter_adresse: '',
    mieter_name: '',
    mieter_adresse: '',
    mieter_email: '',

    // Schuld
    schuld_art: 'miete', // miete, nebenkosten, kaution, sonstiges
    schuld_betrag: '',
    schuld_zeitraum: '',
    schuld_beschreibung: '',

    // Zahlungsdetails
    zahlungsziel_tage: 14,
    zahlungsempfaenger: 'vermieter',
    bankverbindung_iban: '',
    bankverbindung_bic: '',
    kontoinhaber: '',

    // Mahnschreiben
    mahnstufe: 1, // 1, 2, 3
    frist_erfuellt: true,
    ankuendigung_rechtliche_schritte: true,
    mahnstufe_text: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      updateFormData('vermieter_name', currentUser.full_name || '');
      updateFormData('vermieter_adresse', currentUser.email || '');
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const mahnstufeTexts = {
    1: 'Erste Mahnung - höfliche Aufforderung zur Zahlung',
    2: 'Zweite Mahnung - ernsthafte Aufforderung mit Ankündigung rechtlicher Schritte',
    3: 'Fälligkeitsmitteilung - Letzte Aufforderung vor rechtlichen Schritten'
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.vermieter_name || !formData.mieter_name) {
        toast.error('Bitte Vermieter und Mieter angeben');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.schuld_betrag || !formData.schuld_zeitraum) {
        toast.error('Bitte Schuldbetrag und Zeitraum angeben');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generateDocument = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'mahnschreiben',
        data: {
          vermieter: {
            name: formData.vermieter_name,
            adresse: formData.vermieter_adresse
          },
          mieter: {
            name: formData.mieter_name,
            adresse: formData.mieter_adresse,
            email: formData.mieter_email
          },
          schuld: {
            art: formData.schuld_art,
            betrag: formData.schuld_betrag,
            zeitraum: formData.schuld_zeitraum,
            beschreibung: formData.schuld_beschreibung
          },
          zahlungsdetails: {
            empfaenger: formData.zahlungsempfaenger,
            iban: formData.bankverbindung_iban,
            bic: formData.bankverbindung_bic,
            kontoinhaber: formData.kontoinhaber,
            frist_tage: formData.zahlungsziel_tage
          },
          mahnung: {
            stufe: formData.mahnstufe,
            ankuendigung_schritte: formData.ankuendigung_rechtliche_schritte
          },
          datum: new Date().toISOString().split('T')[0],
          faelligkeitsdatum: new Date(Date.now() + formData.zahlungsziel_tage * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Mahnschreiben erstellt!');
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
            ⚠️ Mahnschreiben Generator
          </h1>
          <p className="text-gray-600">
            Rechtssicheres Mahnschreiben für unbezahlte Miete oder Nebenkosten
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={3} steps={['Parteien', 'Schuld', 'Mahndetails']} />

        {currentStep === 1 && (
          <FormSection title="Schritt 1: Parteien">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Vermieter (Gläubiger)</h4>
                <div className="space-y-2">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.vermieter_name}
                      onChange={(e) => updateFormData('vermieter_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Anschrift *</Label>
                    <Input
                      value={formData.vermieter_adresse}
                      onChange={(e) => updateFormData('vermieter_adresse', e.target.value)}
                      placeholder="Vermieterweg 1, 12345 Berlin"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Mieter (Schuldner)</h4>
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
                    <Label>Anschrift *</Label>
                    <Input
                      value={formData.mieter_adresse}
                      onChange={(e) => updateFormData('mieter_adresse', e.target.value)}
                      placeholder="Musterstraße 10, 12345 Berlin"
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
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title="Schritt 2: Schuld">
            <div className="space-y-4">
              <div>
                <Label>Art der Schuld *</Label>
                <select
                  value={formData.schuld_art}
                  onChange={(e) => updateFormData('schuld_art', e.target.value)}
                  className="w-full rounded border p-2"
                >
                  <option value="miete">Mietschulden</option>
                  <option value="nebenkosten">Nebenkostenschulden</option>
                  <option value="kaution">Kautionsschulden</option>
                  <option value="sonstiges">Sonstige Schulden</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Schuldbetrag (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.schuld_betrag}
                    onChange={(e) => updateFormData('schuld_betrag', e.target.value)}
                    placeholder="2100"
                  />
                </div>
                <div>
                  <Label>Zahlungszeitraum *</Label>
                  <Input
                    value={formData.schuld_zeitraum}
                    onChange={(e) => updateFormData('schuld_zeitraum', e.target.value)}
                    placeholder="Januar 2026"
                  />
                </div>
              </div>

              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={formData.schuld_beschreibung}
                  onChange={(e) => updateFormData('schuld_beschreibung', e.target.value)}
                  placeholder="z.B. Zwei Monate Miete für Januar und Februar 2026 wurden nicht gezahlt."
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Zahlungsdetails</h4>
                
                <div>
                  <Label>Zahlungsempfänger</Label>
                  <select
                    value={formData.zahlungsempfaenger}
                    onChange={(e) => updateFormData('zahlungsempfaenger', e.target.value)}
                    className="w-full rounded border p-2 mb-3"
                  >
                    <option value="vermieter">Ich (Vermieter)</option>
                    <option value="dritte">Dritte Person</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="IBAN"
                    value={formData.bankverbindung_iban}
                    onChange={(e) => updateFormData('bankverbindung_iban', e.target.value)}
                  />
                  <Input
                    placeholder="BIC"
                    value={formData.bankverbindung_bic}
                    onChange={(e) => updateFormData('bankverbindung_bic', e.target.value)}
                  />
                  <Input
                    placeholder="Kontoinhaber"
                    value={formData.kontoinhaber}
                    onChange={(e) => updateFormData('kontoinhaber', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {currentStep === 3 && (
          <FormSection title="Schritt 3: Mahndetails">
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 font-semibold">⚠️ Rechtliche Hinweise</p>
                    <p className="text-xs text-red-700 mt-1">
                      Mahnschreiben sind rechtlich verbindlich. Beachten Sie die Fristen und ggfs. Anwaltsgebühren.
                      Bei gewerblichen Mietern können andere Fristen gelten.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Mahnstufe</Label>
                <div className="space-y-2">
                  {[1, 2, 3].map((stufe) => (
                    <label key={stufe} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                      <input
                        type="radio"
                        name="mahnstufe"
                        value={stufe}
                        checked={formData.mahnstufe === stufe}
                        onChange={(e) => updateFormData('mahnstufe', parseInt(e.target.value))}
                      />
                      <div>
                        <div className="font-semibold text-sm">Mahnstufe {stufe}</div>
                        <p className="text-xs text-gray-600">{mahnstufeTexts[stufe]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Zahlungsfrist (Tage)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.zahlungsziel_tage}
                    onChange={(e) => updateFormData('zahlungsziel_tage', e.target.value)}
                  />
                  <p className="text-xs text-gray-600 mt-1">Empfehlung: 14 Tage</p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ankuendigung_rechtliche_schritte}
                  onChange={(e) => updateFormData('ankuendigung_rechtliche_schritte', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-sm">Ankündigung rechtlicher Schritte</div>
                  <p className="text-xs text-gray-600">Hinweis auf mögliche Kündigung oder Klage</p>
                </div>
              </label>

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
                      Mahnschreiben erstellen
                    </>
                  )}
                </Button>
              )}

              {generatedDoc && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold">✓ Mahnschreiben erstellt!</p>
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
            {currentStep === 3 ? 'Fertig' : 'Weiter →'}
          </Button>
        </div>
      </div>
    </div>
  );
}