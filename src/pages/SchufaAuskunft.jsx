import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Mail, Download, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';

export default function SchufaAuskunft() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedLetter, setGeneratedLetter] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Info
    // (nur Info-Seite, keine Eingabe)

    // Schritt 2: Empfänger
    empfaenger_name: '',
    empfaenger_email: '',
    objekt_adresse: '',
    einzugstermin: '',

    // Schritt 3: Anforderungs-Details
    frist_tage: 7,
    auskunftsart: 'bonitaetscheck', // bonitaetscheck oder datenkopie
    upload_link_generieren: true,

    // Schritt 4: Nachricht & Versand
    vorschau_text: ''
  });

  const steps = ['Info', 'Empfänger', 'Details', 'Versand'];

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

  const generatePreviewText = () => {
    const text = `Sehr geehrte/r ${formData.empfaenger_name || '[Name]'},

vielen Dank für Ihr Interesse an der Wohnung
${formData.objekt_adresse || '[Adresse]'}.

Um Ihre Bewerbung abschließend prüfen zu können, bitte ich Sie,
mir innerhalb von ${formData.frist_tage} Tagen eine aktuelle SCHUFA-Auskunft
zukommen zu lassen.

Sie haben zwei Möglichkeiten:

1. SCHUFA-BonitätsCheck (sofort verfügbar, ca. 29,95€)
   → https://www.meineschufa.de/bonitaetscheck

2. Kostenlose SCHUFA-Datenkopie (1-4 Wochen Wartezeit)
   → https://www.meineschufa.de/datenkopie

Bitte senden Sie mir das Dokument per Email oder laden Sie es
unter dem bereitgestellten Link hoch.

Mit freundlichen Grüßen
${user?.full_name || '[Ihr Name]'}`;

    updateFormData('vorschau_text', text);
  };

  const nextStep = () => {
    if (currentStep === 2) {
      if (!formData.empfaenger_name || !formData.empfaenger_email || !formData.objekt_adresse) {
        toast.error('Bitte alle Felder ausfüllen');
        return;
      }
      generatePreviewText();
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const sendLetter = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('sendDocumentRequest', {
        recipient_name: formData.empfaenger_name,
        recipient_email: formData.empfaenger_email,
        property_address: formData.objekt_adresse,
        move_in_date: formData.einzugstermin,
        auskunftsart: formData.auskunftsart,
        frist_tage: formData.frist_tage,
        create_upload_portal: formData.upload_link_generieren,
        sender_name: user?.full_name
      });

      if (result.data) {
        setGeneratedLetter(result.data);
        toast.success('SCHUFA-Anforderung versendet!');
      }
    } catch (err) {
      console.error('Send error:', err);
      toast.error('Fehler beim Versenden');
    } finally {
      setLoading(false);
    }
  };

  const copyPreview = () => {
    navigator.clipboard.writeText(formData.vorschau_text);
    toast.success('Text kopiert!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 SCHUFA-Auskunft anfordern
          </h1>
          <p className="text-gray-600">
            Professionelles Anforderungsschreiben für Mietinteressenten
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={steps} />

        {/* Schritt 1: Info */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 4: Was ist die SCHUFA?">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">ℹ️ WAS IST DIE SCHUFA?</h3>
                  <p className="text-sm text-blue-800">
                    Die SCHUFA speichert Daten zur Kreditwürdigkeit von Personen.
                    Eine positive SCHUFA zeigt, dass der Mieter seine Rechnungen bezahlt.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-blue-900 mb-2">⚠️ WICHTIG FÜR VERMIETER:</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Sie können NICHT selbst eine SCHUFA-Auskunft über den Mieter einholen!
                    Der Mietinteressent muss die Auskunft SELBST beantragen und Ihnen
                    zur Verfügung stellen.
                  </p>

                  <div className="bg-white rounded p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">●</span>
                      <div>
                        <div className="font-semibold text-sm">SCHUFA-BonitätsCheck (empfohlen)</div>
                        <p className="text-xs text-gray-600">
                          Speziell für Vermieter, zeigt nur relevante Daten
                        </p>
                        <p className="text-xs text-gray-600">Kosten: ca. 29,95€ | Sofort online</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-lg">○</span>
                      <div>
                        <div className="font-semibold text-sm">SCHUFA-Datenkopie (Art. 15 DSGVO)</div>
                        <p className="text-xs text-gray-600">
                          Kostenlos, aber dauert 1-4 Wochen
                        </p>
                        <p className="text-xs text-gray-600">Enthält ALLE Daten (auch irrelevante)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Tipp:</strong> Bieten Sie beiden Optionen an. Der Mietinteressent
                  entscheidet selbst, welche Variante er wählt.
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Empfänger */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Empfänger & Objekt">
            <div className="space-y-4">
              <div>
                <Label>Name des Mietinteressenten *</Label>
                <Input
                  value={formData.empfaenger_name}
                  onChange={(e) => updateFormData('empfaenger_name', e.target.value)}
                  placeholder="Anna Beispiel"
                />
              </div>

              <div>
                <Label>Email-Adresse *</Label>
                <Input
                  type="email"
                  value={formData.empfaenger_email}
                  onChange={(e) => updateFormData('empfaenger_email', e.target.value)}
                  placeholder="anna.beispiel@email.de"
                />
              </div>

              <div>
                <Label>Objekt-Adresse *</Label>
                <Input
                  value={formData.objekt_adresse}
                  onChange={(e) => updateFormData('objekt_adresse', e.target.value)}
                  placeholder="Musterstraße 10, 3OG links, 12345 Berlin"
                />
              </div>

              <div>
                <Label>Gewünschter Einzugstermin</Label>
                <Input
                  type="date"
                  value={formData.einzugstermin}
                  onChange={(e) => updateFormData('einzugstermin', e.target.value)}
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Details */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Anforderungs-Details">
            <div className="space-y-6">
              <div>
                <Label>Frist zur Einreichung (Tage)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.frist_tage}
                  onChange={(e) => updateFormData('frist_tage', e.target.value)}
                />
              </div>

              <div>
                <Label>Welche SCHUFA-Auskunft empfehlen?</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border cursor-pointer">
                    <input
                      type="radio"
                      name="auskunftsart"
                      value="bonitaetscheck"
                      checked={formData.auskunftsart === 'bonitaetscheck'}
                      onChange={(e) => updateFormData('auskunftsart', e.target.value)}
                    />
                    <div>
                      <div className="font-semibold text-sm">BonitätsCheck</div>
                      <p className="text-xs text-gray-600">Empfohlen - sofort, speziell für Vermieter</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border cursor-pointer">
                    <input
                      type="radio"
                      name="auskunftsart"
                      value="datenkopie"
                      checked={formData.auskunftsart === 'datenkopie'}
                      onChange={(e) => updateFormData('auskunftsart', e.target.value)}
                    />
                    <div>
                      <div className="font-semibold text-sm">Kostenlose Datenkopie</div>
                      <p className="text-xs text-gray-600">DSGVO-Anrecht, aber 1-4 Wochen Wartezeit</p>
                    </div>
                  </label>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.upload_link_generieren}
                  onChange={(e) => updateFormData('upload_link_generieren', e.target.checked)}
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Upload-Portal generieren</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Mieter kann SCHUFA-Datei über sicheren Link hochladen
                  </p>
                </div>
              </label>
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Versand */}
        {currentStep === 4 && (
          <FormSection title="Schritt 4 von 4: Vorschau & Versand">
            <div className="space-y-6">
              {!generatedLetter ? (
                <>
                  <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {formData.vorschau_text}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={copyPreview}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Text kopieren
                    </Button>
                    <Button
                      onClick={sendLetter}
                      disabled={loading}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Versendet...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Per Email versenden
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 space-y-2">
                    <p className="text-sm text-yellow-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Versand:</strong> Email wird an {formData.empfaenger_email} versendet
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold">✓ SCHUFA-Anforderung versendet!</p>
                    <p className="text-sm text-green-700 mt-2">
                      {formData.empfaenger_name} hat die Anforderung per Email erhalten.
                    </p>
                  </div>

                  {generatedLetter.upload_portal_url && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-blue-800 font-semibold">📎 Upload-Portal</p>
                      <p className="text-xs text-blue-700 mb-2">
                        Der Mietinteressent kann SCHUFA-Datei hier hochladen:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={generatedLetter.upload_portal_url}
                          className="text-xs"
                        />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLetter.upload_portal_url);
                            toast.success('Link kopiert!');
                          }}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">Nächste Schritte:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>✓ Warten Sie auf die eingescannte SCHUFA-Auskunft</li>
                      <li>✓ Laden Sie das Dokument aus dem Upload-Portal herunter</li>
                      <li>✓ Prüfen Sie die Bonität des Mietinteressenten</li>
                      <li>✓ Treffen Sie Ihre Entscheidung zur Vermietung</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => {
                      setGeneratedLetter(null);
                      setCurrentStep(2);
                      updateFormData('empfaenger_name', '');
                      updateFormData('empfaenger_email', '');
                      updateFormData('objekt_adresse', '');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Weitere SCHUFA-Anforderung
                  </Button>
                </div>
              )}
            </div>
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
            disabled={loading || (currentStep === 4 && !generatedLetter)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentStep === 4 ? (
              'Fertig'
            ) : (
              'Weiter →'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}