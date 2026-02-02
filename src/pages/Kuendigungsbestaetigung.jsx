import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, Save, Info, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Kuendigungsbestaetigung() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Parteien & Wohnung
    absender_typ: 'vermieter', // vermieter oder mieter
    absender_name: '',
    empfaenger_name: '',
    wohnung: '',
    
    // Schritt 2: Kündigungsdetails
    kuendigung_eingegangen_am: '',
    kuendigung_art: 'ordentlich', // ordentlich, ausserordentlich
    kuendigung_grund: '', // grund für außerordentlich
    
    // Schritt 3: Termine
    mietbeginn: '',
    kuendigung_zum: '',
    auskunftsfrist_tage: 3,
    
    // Schritt 4: Schlusspunkte
    schluesseluebergabe: '',
    kaution_rueckgabe: 'innerhalb_6_monate',
    schlussabrechnung_bis: '',
    
    // Zustands-Checking
    uebergabeprotokoll_erstellt: false,
    kaution_geprueft: false,
    nebenkos_abrechnung_geprueft: false
  });

  const [kuendigungsanalyse, setKuendigungsanalyse] = useState(null);

  const steps = [
    'Parteien',
    'Kündigung',
    'Termine',
    'Dokument'
  ];

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      autoSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [formData, user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      updateFormData('absender_name', currentUser.full_name || '');
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const autoSave = async () => {
    try {
      await base44.functions.invoke('saveDocument', {
        template_id: 'kuendigungsbestaetigung',
        document_name: `Kündigungsbestätigung ${formData.wohnung || 'Entwurf'}`,
        data: formData,
        status: 'draft'
      });
    } catch (err) {
      console.error('Auto-save error:', err);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTermine = () => {
    if (formData.kuendigung_eingegangen_am) {
      const eingegangen = new Date(formData.kuendigung_eingegangen_am);
      
      // Auskunftsfrist
      const auskunft = new Date(eingegangen.getTime() + parseInt(formData.auskunftsfrist_tage) * 24 * 60 * 60 * 1000);
      
      // Schlussmeldung sollte vor Auszug sein
      const auszug = new Date(formData.kuendigung_zum);
      const schluss = new Date(auszug.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      updateFormData('schlussabrechnung_bis', schluss.toISOString().split('T')[0]);
    }
  };

  const analysiereKuendigung = () => {
    calculateTermine();

    let analyse = {
      kuendigung_art: formData.kuendigung_art,
      eingegangen_am: formData.kuendigung_eingegangen_am,
      kuendigung_zum: formData.kuendigung_zum,
      auskunftsfrist_bis: new Date(new Date(formData.kuendigung_eingegangen_am).getTime() + parseInt(formData.auskunftsfrist_tage) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      probleme: [],
      empfehlungen: [],
      abwicklung_komplett: false
    };

    // Prüfe Dokumente
    if (!formData.uebergabeprotokoll_erstellt) {
      analyse.probleme.push({
        typ: 'wichtig',
        text: 'Übergabeprotokoll sollte erstellt werden'
      });
    }

    if (!formData.kaution_geprueft) {
      analyse.probleme.push({
        typ: 'wichtig',
        text: 'Kaution muss geprüft werden'
      });
    }

    if (!formData.nebenkos_abrechnung_geprueft) {
      analyse.probleme.push({
        typ: 'wichtig',
        text: 'Nebenkostenabrechnung muss erstellt werden'
      });
    }

    if (formData.uebergabeprotokoll_erstellt && formData.kaution_geprueft && formData.nebenkos_abrechnung_geprueft) {
      analyse.abwicklung_komplett = true;
      analyse.empfehlungen.push('Alle wichtigen Dokumente sind vorbereitet - Abwicklung kann stattfinden');
    }

    setKuendigungsanalyse(analyse);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.absender_name || !formData.empfaenger_name || !formData.wohnung) {
        toast.error('Bitte Basisinformationen ausfüllen');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.kuendigung_eingegangen_am || !formData.kuendigung_zum) {
        toast.error('Bitte Kündigungsdaten ausfüllen');
        return;
      }
    }

    if (currentStep === 3) {
      analysiereKuendigung();
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
        template_id: 'kuendigungsbestaetigung',
        data: {
          absender: {
            typ: formData.absender_typ,
            name: formData.absender_name
          },
          empfaenger: {
            name: formData.empfaenger_name
          },
          wohnung: formData.wohnung,
          kuendigung: {
            eingegangen_am: formData.kuendigung_eingegangen_am,
            art: formData.kuendigung_art,
            grund: formData.kuendigung_grund,
            zum: formData.kuendigung_zum,
            auskunftsfrist_tage: formData.auskunftsfrist_tage
          },
          mietbeginn: formData.mietbeginn,
          schlusspunkte: {
            schluesseluebergabe: formData.schluesseluebergabe,
            kaution_rueckgabe: formData.kaution_rueckgabe,
            schlussabrechnung_bis: formData.schlussabrechnung_bis
          },
          vorbereitung: {
            uebergabeprotokoll: formData.uebergabeprotokoll_erstellt,
            kaution_geprueft: formData.kaution_geprueft,
            nebenkos_geprueft: formData.nebenkos_abrechnung_geprueft
          },
          analyse: kuendigungsanalyse,
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Kündigungsbestätigung erstellt');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!generatedDoc) return;
    setLoading(true);
    try {
      await base44.functions.invoke('sendDocumentEmail', {
        document_url: generatedDoc.document_url,
        recipient: {
          email: 'empfaenger@example.com',
          name: formData.empfaenger_name
        },
        email_template: 'kuendigungsbestaetigung',
        context: {
          kuendigung_zum: formData.kuendigung_zum
        }
      });
      toast.success('Bestätigung versendet');
    } catch (err) {
      console.error('Email error:', err);
      toast.error('Fehler beim Versenden');
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
            📋 Kündigungsbestätigung
          </h1>
          <p className="text-gray-600">
            Bestätigen Sie den Empfang einer Kündigung schriftlich
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={steps} />

        {/* Schritt 1: Parteien */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 4: Parteien & Wohnung">
            <div className="space-y-4">
              <div>
                <Label>Wer sendet diese Bestätigung? *</Label>
                <Select
                  value={formData.absender_typ}
                  onValueChange={(val) => updateFormData('absender_typ', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vermieter">Vermieter</SelectItem>
                    <SelectItem value="mieter">Mieter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Absender (Ihr Name) *</Label>
                  <Input
                    value={formData.absender_name}
                    onChange={(e) => updateFormData('absender_name', e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <Label>{formData.absender_typ === 'vermieter' ? 'Mieter' : 'Vermieter'} *</Label>
                  <Input
                    value={formData.empfaenger_name}
                    onChange={(e) => updateFormData('empfaenger_name', e.target.value)}
                    placeholder="Anna Beispiel"
                  />
                </div>
              </div>

              <div>
                <Label>Wohnung / Objekt *</Label>
                <Input
                  value={formData.wohnung}
                  onChange={(e) => updateFormData('wohnung', e.target.value)}
                  placeholder="Musterstraße 10, 3. OG links, 10115 Berlin"
                />
              </div>

              <div>
                <Label>Mietbeginn</Label>
                <Input
                  type="date"
                  value={formData.mietbeginn}
                  onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Was ist eine Kündigungsbestätigung?</strong> Sie bestätigt schriftlich den Empfang einer Kündigung 
                    und dokumentiert die wichtigsten Termine und Bedingungen für die Auszugsabwicklung.
                  </span>
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Kündigung */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Kündigungsdetails">
            <div className="space-y-4">
              <div>
                <Label>Kündigung eingegangen am *</Label>
                <Input
                  type="date"
                  value={formData.kuendigung_eingegangen_am}
                  onChange={(e) => updateFormData('kuendigung_eingegangen_am', e.target.value)}
                />
              </div>

              <div>
                <Label>Kündigung zum / Auszugstag *</Label>
                <Input
                  type="date"
                  value={formData.kuendigung_zum}
                  onChange={(e) => updateFormData('kuendigung_zum', e.target.value)}
                />
              </div>

              <div>
                <Label>Art der Kündigung</Label>
                <Select
                  value={formData.kuendigung_art}
                  onValueChange={(val) => updateFormData('kuendigung_art', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordentlich">Ordentliche Kündigung</SelectItem>
                    <SelectItem value="ausserordentlich">Außerordentliche Kündigung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.kuendigung_art === 'ausserordentlich' && (
                <div>
                  <Label>Grund der außerordentlichen Kündigung</Label>
                  <Textarea
                    value={formData.kuendigung_grund}
                    onChange={(e) => updateFormData('kuendigung_grund', e.target.value)}
                    rows={3}
                    placeholder="Grund für die außerordentliche Kündigung..."
                  />
                </div>
              )}

              <div>
                <Label>Auskunftsfrist (Tage nach Eingang)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.auskunftsfrist_tage}
                  onChange={(e) => updateFormData('auskunftsfrist_tage', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Normalerweise 3 Tage für Rückfragen</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Hinweis:</strong> Diese Bestätigung dokumentiert, dass Sie die Kündigung erhalten haben. 
                  Sie ist wichtig für beiden Seiten, um Missverständnisse zu vermeiden.
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Termine & Vorbereitung */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Termine & Vorbereitung">
            <div className="space-y-6">
              <div>
                <Label>Schlüsselübergabe am</Label>
                <Input
                  type="date"
                  value={formData.schluesseluebergabe}
                  onChange={(e) => updateFormData('schluesseluebergabe', e.target.value)}
                />
              </div>

              <div>
                <Label>Kaution-Rückgabe innerhalb von</Label>
                <Select
                  value={formData.kaution_rueckgabe}
                  onValueChange={(val) => updateFormData('kaution_rueckgabe', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sofort">Sofort</SelectItem>
                    <SelectItem value="2_wochen">2 Wochen</SelectItem>
                    <SelectItem value="1_monat">1 Monat</SelectItem>
                    <SelectItem value="3_monate">3 Monate</SelectItem>
                    <SelectItem value="innerhalb_6_monate">Innerhalb 6 Monate (gesetzlich)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-3">
                <h4 className="font-semibold text-blue-900">Auszugsvorbereitung prüfen</h4>
                
                <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-blue-100 rounded">
                  <input
                    type="checkbox"
                    checked={formData.uebergabeprotokoll_erstellt}
                    onChange={(e) => updateFormData('uebergabeprotokoll_erstellt', e.target.checked)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Übergabeprotokoll erstellt</div>
                    <p className="text-xs text-blue-800 mt-1">Dokumentiert Zustand der Wohnung</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-blue-100 rounded">
                  <input
                    type="checkbox"
                    checked={formData.kaution_geprueft}
                    onChange={(e) => updateFormData('kaution_geprueft', e.target.checked)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Kaution geprüft</div>
                    <p className="text-xs text-blue-800 mt-1">Kautionssumme und Bedingungen geklärt</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-blue-100 rounded">
                  <input
                    type="checkbox"
                    checked={formData.nebenkos_abrechnung_geprueft}
                    onChange={(e) => updateFormData('nebenkos_abrechnung_geprueft', e.target.checked)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Nebenkostenabrechnung geprüft</div>
                    <p className="text-xs text-blue-800 mt-1">Abrechnung vorbereitet</p>
                  </div>
                </label>
              </div>

              {!kuendigungsanalyse && (
                <Button
                  onClick={analysiereKuendigung}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Abwicklung analysieren
                    </>
                  )}
                </Button>
              )}

              {kuendigungsanalyse && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-purple-900">Abwicklungs-Checkliste</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      kuendigungsanalyse.abwicklung_komplett ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {kuendigungsanalyse.abwicklung_komplett ? '✓ Komplett' : '⚠ Unvollständig'}
                    </span>
                  </div>

                  {kuendigungsanalyse.probleme.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-gray-700">Zu beachten:</p>
                      {kuendigungsanalyse.probleme.map((prob, idx) => (
                        <div key={idx} className="p-2 bg-yellow-100 text-yellow-800 rounded text-sm flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {prob.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {kuendigungsanalyse.empfehlungen.length > 0 && (
                    <div className="space-y-2">
                      {kuendigungsanalyse.empfehlungen.map((emp, idx) => (
                        <div key={idx} className="p-2 bg-green-100 text-green-800 rounded text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {emp}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Dokument */}
        {currentStep === 4 && (
          <div>
            <FormSection title="Schritt 4 von 4: Bestätigung erstellen">
              <div className="space-y-6">
                {!generatedDoc ? (
                  <div className="text-center py-8">
                    <Button
                      onClick={generateDocument}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Erstelle Bestätigung...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-5 h-5 mr-2" />
                          Bestätigung erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Bestätigung erstellt!
                      </div>
                      <div className="text-sm text-green-600">
                        Dokument-ID: {generatedDoc.document_id}
                      </div>
                    </div>

                    <div className="flex gap-3 flex-wrap justify-center">
                      <Button
                        onClick={() => window.open(generatedDoc.document_url, '_blank')}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF herunterladen
                      </Button>
                      <Button
                        onClick={sendEmail}
                        disabled={loading}
                        variant="outline"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Per Email senden
                      </Button>
                      <Button
                        onClick={autoSave}
                        variant="outline"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Speichern
                      </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                      <p className="text-sm text-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Wichtig:</strong> Senden Sie diese Bestätigung per Email mit Lesebestätigung oder 
                          per Einschreiben, um den Erhalt zu dokumentieren.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Kündigungen zentral verwalten"
              benefit="Mit Vermietify werden alle Kündigungen, Termine und Auszugsfristen automatisch verwaltet und überwacht."
            />
          </div>
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
            disabled={loading || (currentStep === 4 && !generatedDoc)}
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