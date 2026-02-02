import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, Save, Plus, Trash2, Info, DollarSign, Calendar } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Zahlungsplan() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Parteien
    mieter_name: '',
    vermieter_name: '',
    wohnung: '',
    
    // Schritt 2: Schulden
    gesamtschulden: '',
    schuldengruende: '', // Mietrückstand, Nebenkos, Beschädigungen, etc.
    zahlungsgruende: 'schwierigkeiten', // schwierigkeiten, arbeitslosigkeit, sonstiges
    
    // Schritt 3: Zahlungsplan
    raten: [
      {
        nummer: 1,
        betrag: '',
        faellig_am: '',
        beschreibung: ''
      }
    ],
    
    // Optional: Verzinsung
    verzinsung_prozent: 0,
    
    // Schritt 4: Bedingungen
    vorbedingung_komplett: false, // Zahlung der ganzen Schuld Vorbedingung
    konsequenz_zahlungsausfall: 'kuendigung', // kuendigung, mahnung
    zahlungsart: 'ueberweisung' // ueberweisung, dauerauftrag, lastschrift
  });

  const [zahlungsplanung, setZahlungsplanung] = useState(null);

  const steps = [
    'Parteien',
    'Schulden',
    'Zahlungsplan',
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
      updateFormData('vermieter_name', currentUser.full_name || '');
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const autoSave = async () => {
    try {
      await base44.functions.invoke('saveDocument', {
        template_id: 'zahlungsplan',
        document_name: `Zahlungsplan ${formData.wohnung || 'Entwurf'}`,
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

  const addRate = () => {
    setFormData(prev => ({
      ...prev,
      raten: [...prev.raten, {
        nummer: prev.raten.length + 1,
        betrag: '',
        faellig_am: '',
        beschreibung: ''
      }]
    }));
  };

  const removeRate = (index) => {
    setFormData(prev => ({
      ...prev,
      raten: prev.raten.filter((_, i) => i !== index)
    }));
  };

  const updateRate = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      raten: prev.raten.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  const calculateZahlungsplan = () => {
    const gesamtschulden = parseFloat(formData.gesamtschulden) || 0;
    const raten = formData.raten.filter(r => r.betrag);
    const gesamtRaten = raten.reduce((sum, r) => sum + (parseFloat(r.betrag) || 0), 0);
    
    let planung = {
      gesamtschulden: gesamtschulden,
      zahlungsplaene: raten.length,
      gesamtbetrag_plan: gesamtRaten,
      differenz: gesamtschulden - gesamtRaten,
      raten: raten.map((r, idx) => ({
        ...r,
        laufende_summe: raten.slice(0, idx + 1).reduce((sum, rate) => sum + (parseFloat(rate.betrag) || 0), 0)
      })),
      probleme: [],
      empfehlungen: []
    };

    if (planung.differenz > 0.5) {
      planung.probleme.push({
        typ: 'warnung',
        text: `Differenz: ${planung.differenz.toFixed(2)}€ nicht abgedeckt`
      });
    } else if (planung.differenz < -0.5) {
      planung.probleme.push({
        typ: 'warnung',
        text: `Überdeckung: ${Math.abs(planung.differenz).toFixed(2)}€ zu viel`
      });
    }

    if (raten.length === 0) {
      planung.probleme.push({
        typ: 'fehler',
        text: 'Mindestens eine Rate erforderlich'
      });
    }

    if (raten.length > 24) {
      planung.empfehlungen.push('Mehr als 24 Raten können schwierig durchzusetzen sein');
    }

    setZahlungsplanung(planung);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.mieter_name || !formData.vermieter_name || !formData.wohnung) {
        toast.error('Bitte Basisinformationen ausfüllen');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.gesamtschulden || !formData.schuldengruende) {
        toast.error('Bitte Gesamtschulden und Gründe angeben');
        return;
      }
    }

    if (currentStep === 3) {
      calculateZahlungsplan();
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
        template_id: 'zahlungsplan',
        data: {
          mieter: {
            name: formData.mieter_name
          },
          vermieter: {
            name: formData.vermieter_name
          },
          wohnung: formData.wohnung,
          schulden: {
            gesamtbetrag: formData.gesamtschulden,
            gruende: formData.schuldengruende,
            zahlungsgruende: formData.zahlungsgruende
          },
          zahlungsplan: {
            raten: formData.raten.filter(r => r.betrag),
            verzinsung_prozent: formData.verzinsung_prozent,
            gesamtbetrag: zahlungsplanung.gesamtbetrag_plan
          },
          bedingungen: {
            vorbedingung_komplett: formData.vorbedingung_komplett,
            konsequenz_ausfall: formData.konsequenz_zahlungsausfall,
            zahlungsart: formData.zahlungsart
          },
          planung: zahlungsplanung,
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Zahlungsplan erfolgreich erstellt');
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
          email: 'mieter@example.com',
          name: formData.mieter_name
        },
        email_template: 'zahlungsplan',
        context: {
          gesamtschulden: formData.gesamtschulden,
          anzahl_raten: formData.raten.filter(r => r.betrag).length
        }
      });
      toast.success('Zahlungsplan versendet');
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
            💳 Zahlungsplan erstellen
          </h1>
          <p className="text-gray-600">
            Einigen Sie sich auf ratiertes Bezahlen von Schulden
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={steps} />

        {/* Schritt 1: Parteien */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 4: Parteien">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Mieter *</Label>
                  <Input
                    value={formData.mieter_name}
                    onChange={(e) => updateFormData('mieter_name', e.target.value)}
                    placeholder="Anna Beispiel"
                  />
                </div>
                <div>
                  <Label>Vermieter *</Label>
                  <Input
                    value={formData.vermieter_name}
                    onChange={(e) => updateFormData('vermieter_name', e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>
              </div>

              <div>
                <Label>Wohnung / Objekt *</Label>
                <Input
                  value={formData.wohnung}
                  onChange={(e) => updateFormData('wohnung', e.target.value)}
                  placeholder="Musterstraße 10, 3. OG links"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Was ist ein Zahlungsplan?</strong> Ein Zahlungsplan ist eine schriftliche Vereinbarung zwischen 
                    Mieter und Vermieter, um Schulden in mehreren Raten zu begleichen. Er kann Kündigungen verhindern.
                  </span>
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Schulden */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Schulden erfassen">
            <div className="space-y-4">
              <div>
                <Label>Gesamtschulden (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.gesamtschulden}
                  onChange={(e) => updateFormData('gesamtschulden', e.target.value)}
                  placeholder="3500.00"
                />
              </div>

              <div>
                <Label>Gründe der Schulden *</Label>
                <Input
                  value={formData.schuldengruende}
                  onChange={(e) => updateFormData('schuldengruende', e.target.value)}
                  placeholder="z.B. Mietrückstand Jan-Mar 2025"
                />
              </div>

              <div>
                <Label>Grund für Zahlungsschwierigkeiten</Label>
                <Select
                  value={formData.zahlungsgruende}
                  onValueChange={(val) => updateFormData('zahlungsgruende', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schwierigkeiten">Finanzielle Schwierigkeiten</SelectItem>
                    <SelectItem value="arbeitslosigkeit">Arbeitslosigkeit</SelectItem>
                    <SelectItem value="kurzarbeit">Kurzarbeit</SelectItem>
                    <SelectItem value="krankheit">Krankheit / Behinderung</SelectItem>
                    <SelectItem value="sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Verzinsung (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.verzinsung_prozent}
                  onChange={(e) => updateFormData('verzinsung_prozent', e.target.value)}
                  placeholder="5.5"
                />
                <p className="text-xs text-gray-500 mt-1">Gesetzliche Verzinsung: 5% + Basiszinssatz (ca. 6-8%)</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Hinweis:</strong> Ein Zahlungsplan ist ein Vergleich - beide Parteien müssen zustimmen. 
                  Der Mieter erklärt sich einverstanden, die Schulden zu bezahlen, der Vermieter verzichtet (vorübergehend) auf Kündigung.
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Zahlungsplan */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Zahlungsplan definieren">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tipp:</strong> Definieren Sie realistische Raten, die der Mieter zahlen kann, ohne neue Schulden aufzubauen.
                </p>
              </div>

              {formData.raten.map((rate, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold">Rate {index + 1}</h4>
                    {formData.raten.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRate(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Betrag (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rate.betrag}
                          onChange={(e) => updateRate(index, 'betrag', e.target.value)}
                          placeholder="500.00"
                        />
                      </div>
                      <div>
                        <Label>Fällig am</Label>
                        <Input
                          type="date"
                          value={rate.faellig_am}
                          onChange={(e) => updateRate(index, 'faellig_am', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Beschreibung (optional)</Label>
                      <Input
                        value={rate.beschreibung}
                        onChange={(e) => updateRate(index, 'beschreibung', e.target.value)}
                        placeholder="z.B. Januarmietmiete"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                onClick={addRate}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Weiterer Rate hinzufügen
              </Button>

              {!zahlungsplanung && (
                <Button
                  onClick={calculateZahlungsplan}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Berechne...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Zahlungsplan berechnen
                    </>
                  )}
                </Button>
              )}

              {zahlungsplanung && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl p-6 space-y-4">
                  <h4 className="font-bold text-lg text-emerald-900">Zahlungsplan-Übersicht</h4>

                  <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Gesamtschuld:</span>
                      <span className="font-semibold">{zahlungsplanung.gesamtschulden.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Zahlungsplan-Summe:</span>
                      <span className="font-semibold text-green-600">{zahlungsplanung.gesamtbetrag_plan.toFixed(2)} €</span>
                    </div>
                    {zahlungsplanung.differenz !== 0 && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-gray-700">Differenz:</span>
                        <span className={`font-semibold ${zahlungsplanung.differenz > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          {zahlungsplanung.differenz.toFixed(2)} €
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Anzahl Raten:</span>
                      <span className="font-semibold">{zahlungsplanung.zahlungsplaene}</span>
                    </div>
                  </div>

                  {zahlungsplanung.probleme.length > 0 && (
                    <div className="space-y-2">
                      {zahlungsplanung.probleme.map((prob, idx) => (
                        <div key={idx} className="p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                          {prob.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold">Bedingungen</h4>
                
                <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.vorbedingung_komplett}
                    onChange={(e) => updateFormData('vorbedingung_komplett', e.target.checked)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Komplettzahlung ist Vorbedingung</div>
                    <p className="text-xs text-gray-600 mt-1">Mieter muss alle Raten vollständig zahlen</p>
                  </div>
                </label>

                <div>
                  <Label>Folge bei Zahlungsausfall</Label>
                  <Select
                    value={formData.konsequenz_zahlungsausfall}
                    onValueChange={(val) => updateFormData('konsequenz_zahlungsausfall', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kuendigung">Sofortige Kündigung</SelectItem>
                      <SelectItem value="mahnung">Neue Mahnung</SelectItem>
                      <SelectItem value="abmahnung">Abmahnung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Zahlungsart</Label>
                  <Select
                    value={formData.zahlungsart}
                    onValueChange={(val) => updateFormData('zahlungsart', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ueberweisung">Banküberweisung</SelectItem>
                      <SelectItem value="dauerauftrag">Dauerauftrag</SelectItem>
                      <SelectItem value="lastschrift">Lastschrift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Dokument */}
        {currentStep === 4 && (
          <div>
            <FormSection title="Schritt 4 von 4: Zahlungsplan erstellen">
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
                          Erstelle Zahlungsplan...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-5 h-5 mr-2" />
                          Zahlungsplan erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Zahlungsplan erstellt!
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
                          <strong>Wichtig:</strong> Der Zahlungsplan muss von beiden Parteien unterzeichnet werden. 
                          Senden Sie ihn per Einschreiben oder Email mit Lesebestätigung.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Zahlungsausfälle reduzieren"
              benefit="Mit Vermietify werden Zahlungspläne überwacht, Raten nachverfolgt und Zahlungsrückstände automatisch erkannt."
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