import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, DollarSign, Calendar, Download, Mail, Save, Plus, Trash2, Info, Clock } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Kautionsrueckforderung() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Basisinfo
    mieter_name: '',
    vermieter_name: '',
    wohnung: '',
    mietbeginn: '',
    mietende: '',
    
    // Schritt 2: Kaution
    kautionsbetrag: '',
    einbehaltener_betrag: '',
    einbehaltsgruende: [], // mehrfachauswahl
    
    // Detaillierte Schaeden
    schaeden: [
      {
        beschreibung: '',
        kategorie: 'schoenheitsreparatur',
        geschaetzter_wert: '',
        fotos: []
      }
    ],
    
    // Schritt 3: Rechtliche Analyse
    fristverbrauch_pruefung: false,
    schoenheitsreparatur_ausschluss: false,
    
    // Schritt 4: Zahlungsinfo
    rueckzahlungsbank: {
      kontoinhaber: '',
      iban: '',
      bic: ''
    }
  });

  const [kautionsanalyse, setKautionsanalyse] = useState(null);

  const steps = [
    'Basisinfo',
    'Kaution',
    'Schäden',
    'Dokument'
  ];

  const schadensKategorien = [
    { value: 'schoenheitsreparatur', label: 'Schönheitsreparatur', max_rueckforderung: 100 },
    { value: 'wand_malerarbeiten', label: 'Wand/Malerei', max_rueckforderung: 100 },
    { value: 'bodenbelag', label: 'Bodenbelag', max_rueckforderung: 100 },
    { value: 'sanitaer', label: 'Sanitär/Bad', max_rueckforderung: 100 },
    { value: 'tueren_fenster', label: 'Türen/Fenster', max_rueckforderung: 100 },
    { value: 'elektrik', label: 'Elektrik', max_rueckforderung: 100 },
    { value: 'mobiliar', label: 'Mobiliar/Inventar', max_rueckforderung: 100 },
    { value: 'sonstiges', label: 'Sonstiges', max_rueckforderung: 100 },
  ];

  const einbehaltsgruendeOptions = [
    { value: 'renovierung', label: 'Renovierungs-/Schönheitsreparaturen', gesetzlich_zula: true },
    { value: 'schaeden', label: 'Beschädigungen über Normalverschleiß', gesetzlich_zula: true },
    { value: 'unrentabel', label: 'Reparaturen "unrentabel"', gesetzlich_zula: false },
    { value: 'kuenftige_schaeden', label: 'Vorbeugende Reparaturen', gesetzlich_zula: false },
    { value: 'nebenkosten', label: 'Nebenkosten-Nachzahlungen', gesetzlich_zula: true },
    { value: 'miete', label: 'Mietrückstände', gesetzlich_zula: true },
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
      updateFormData('mieter_name', currentUser.full_name || '');
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const autoSave = async () => {
    try {
      await base44.functions.invoke('saveDocument', {
        template_id: 'kautionsrueckforderung',
        document_name: `Kautionsrückforderung ${formData.wohnung || 'Entwurf'}`,
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

  const updateNested = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const addSchaden = () => {
    setFormData(prev => ({
      ...prev,
      schaeden: [...prev.schaeden, {
        beschreibung: '',
        kategorie: 'sonstiges',
        geschaetzter_wert: '',
        fotos: []
      }]
    }));
  };

  const removeSchaden = (index) => {
    setFormData(prev => ({
      ...prev,
      schaeden: prev.schaeden.filter((_, i) => i !== index)
    }));
  };

  const updateSchaden = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schaeden: prev.schaeden.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
    }));
  };

  const analysiereKaution = () => {
    const kautiont = parseFloat(formData.kautionsbetrag) || 0;
    const einbehalt = parseFloat(formData.einbehaltener_betrag) || 0;
    const rueckzahlung = kautiont - einbehalt;

    let analyse = {
      kautiont_gesamt: kautiont,
      einbehaltener_betrag: einbehalt,
      rueckzahlungsbetrag: rueckzahlung,
      probleme: [],
      empfehlungen: [],
      erfolgsaussichten: 100
    };

    // Check Fristablauf
    if (formData.mietende) {
      const enddatum = new Date(formData.mietende);
      const heute = new Date();
      const monateSeitAuszug = (heute - enddatum) / (1000 * 60 * 60 * 24 * 30);

      if (monateSeitAuszug > 6) {
        analyse.probleme.push({
          typ: 'kritisch',
          text: 'Mehr als 6 Monate seit Auszug: Vermieter verliert Zurückbehaltungsrecht (§ 548 BGB)'
        });
        analyse.erfolgsaussichten = 100; // Very strong
      } else if (monateSeitAuszug > 3) {
        analyse.probleme.push({
          typ: 'warnung',
          text: 'Über 3 Monate seit Auszug: Vermieter muss Schadenskosten nachweisen'
        });
      }
    }

    // Check Einbehaltungsgründe
    const gesetzlicheGruende = formData.einbehaltsgruende.filter(g => {
      const grund = einbehaltsgruendeOptions.find(o => o.value === g);
      return grund && grund.gesetzlich_zula;
    });

    const ungesetzlicheGruende = formData.einbehaltsgruende.filter(g => {
      const grund = einbehaltsgruendeOptions.find(o => o.value === g);
      return grund && !grund.gesetzlich_zula;
    });

    if (ungesetzlicheGruende.length > 0) {
      analyse.probleme.push({
        typ: 'stark',
        text: `${ungesetzlicheGruende.length} unzulässige Einbehaltungsgründe erkannt: Diese darf der Vermieter nicht verwenden`
      });
      analyse.erfolgsaussichten += 30;
    }

    // Check Schönheitsreparaturen
    if (formData.schoenheitsreparatur_ausschluss && formData.einbehaltsgruende.includes('renovierung')) {
      analyse.probleme.push({
        typ: 'stark',
        text: 'Schönheitsreparaturen waren durch Klausel ausgeschlossen - keine Kürzung zulässig'
      });
      analyse.erfolgsaussichten += 25;
    }

    // Berechne Schadensersatz
    const totalSchaeden = formData.schaeden.reduce((sum, s) => sum + (parseFloat(s.geschaetzter_wert) || 0), 0);
    if (totalSchaeden > einbehalt) {
      analyse.empfehlungen.push(`Vermieter hat offenbar Schäden überschätzt: Angegeben ${einbehalt}€, aber nur ~${totalSchaeden}€ möglich`);
    }

    // Cap at 100
    analyse.erfolgsaussichten = Math.min(analyse.erfolgsaussichten, 100);

    setKautionsanalyse(analyse);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.mieter_name || !formData.vermieter_name || !formData.wohnung) {
        toast.error('Bitte alle Basisinformationen ausfüllen');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.kautionsbetrag) {
        toast.error('Bitte Kautionsbetrag angeben');
        return;
      }
    }

    if (currentStep === 3) {
      analysiereKaution();
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
        template_id: 'kautionsrueckforderung',
        data: {
          mieter: {
            name: formData.mieter_name,
            kontoinhaber: formData.rueckzahlungsbank.kontoinhaber,
            iban: formData.rueckzahlungsbank.iban
          },
          vermieter: {
            name: formData.vermieter_name
          },
          wohnung: formData.wohnung,
          mietverhaeltnis: {
            beginn: formData.mietbeginn,
            ende: formData.mietende
          },
          kaution: {
            betrag_gesamt: formData.kautionsbetrag,
            einbehaltener_betrag: formData.einbehaltener_betrag,
            rueckzahlung: (parseFloat(formData.kautionsbetrag) - parseFloat(formData.einbehaltener_betrag)).toFixed(2),
            einbehaltsgruende: formData.einbehaltsgruende
          },
          schaeden: formData.schaeden.filter(s => s.beschreibung),
          analyse: kautionsanalyse,
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Kautionsrückforderung erfolgreich erstellt');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen der Kautionsrückforderung');
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
          email: 'vermieter@example.com',
          name: formData.vermieter_name
        },
        email_template: 'kautionsrueckforderung',
        context: {
          rueckzahlung: (parseFloat(formData.kautionsbetrag) - parseFloat(formData.einbehaltener_betrag)).toFixed(2)
        }
      });
      toast.success('Email erfolgreich versendet');
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
            💰 Kaution zurückfordern
          </h1>
          <p className="text-gray-600">
            Fordere deine Kaution nach Auszug rechtssicher zurück
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={steps} />

        {/* Schritt 1: Basisinfo */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 4: Basisinformationen">
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
                  placeholder="Musterstraße 10, 3. OG links, 10115 Berlin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Mietbeginn</Label>
                  <Input
                    type="date"
                    value={formData.mietbeginn}
                    onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Mietende / Auszugsdatum *</Label>
                  <Input
                    type="date"
                    value={formData.mietende}
                    onChange={(e) => updateFormData('mietende', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Wichtig:</strong> Der Vermieter muss die Kaution innerhalb von 6 Monaten nach Auszug zurückgeben (§ 548 BGB).
                    Nach 6 Monaten verfällt sein Recht, Schäden einzubehalten.
                  </span>
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Kaution */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Kaution & Einbehaltung">
            <div className="space-y-6">
              <div>
                <Label>Hinterlegte Kaution (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.kautionsbetrag}
                  onChange={(e) => updateFormData('kautionsbetrag', e.target.value)}
                  placeholder="3000.00"
                />
              </div>

              <div>
                <Label>Einbehaltener Betrag (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.einbehaltener_betrag}
                  onChange={(e) => updateFormData('einbehaltener_betrag', e.target.value)}
                  placeholder="500.00"
                />
              </div>

              {formData.kautionsbetrag && formData.einbehaltener_betrag && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700">Rückzahlungsbetrag:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {(parseFloat(formData.kautionsbetrag) - parseFloat(formData.einbehaltener_betrag)).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-lg mb-4 block">Gründe für Einbehaltung (Mehrfachauswahl)</Label>
                <div className="space-y-2">
                  {einbehaltsgruendeOptions.map(grund => (
                    <label key={grund.value} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer">
                      <Checkbox
                        checked={formData.einbehaltsgruende.includes(grund.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              einbehaltsgruende: [...prev.einbehaltsgruende, grund.value]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              einbehaltsgruende: prev.einbehaltsgruende.filter(g => g !== grund.value)
                            }));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{grund.label}</div>
                        {!grund.gesetzlich_zula && (
                          <div className="text-xs text-red-600 mt-1">⚠️ Nicht gesetzlich zulässig</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <Checkbox
                  id="schoenheits"
                  checked={formData.schoenheitsreparatur_ausschluss}
                  onCheckedChange={(checked) => updateFormData('schoenheitsreparatur_ausschluss', checked)}
                />
                <label htmlFor="schoenheits" className="cursor-pointer flex-1">
                  <div className="font-semibold text-gray-900">Schönheitsreparaturen waren ausgeschlossen</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Wenn der Mietvertrag Schönheitsreparaturen ausschloss, darf der Vermieter diese nicht einbehalten
                  </p>
                </label>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Schäden */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Schäden & Analyse">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Dokumentiere hier alle Schäden, die der Vermieter als Grund zur Einbehaltung genannt hat.
                </p>
              </div>

              {formData.schaeden.map((schaden, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold">Schaden {index + 1}</h4>
                    {formData.schaeden.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSchaden(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Kategorie</Label>
                      <Select
                        value={schaden.kategorie}
                        onValueChange={(val) => updateSchaden(index, 'kategorie', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {schadensKategorien.map(kat => (
                            <SelectItem key={kat.value} value={kat.value}>
                              {kat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Beschreibung</Label>
                      <Textarea
                        value={schaden.beschreibung}
                        onChange={(e) => updateSchaden(index, 'beschreibung', e.target.value)}
                        rows={3}
                        placeholder="Detaillierte Beschreibung des Schadens..."
                      />
                    </div>

                    <div>
                      <Label>Geschätzter Wert / Angeforderte Reparatur (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={schaden.geschaetzter_wert}
                        onChange={(e) => updateSchaden(index, 'geschaetzter_wert', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                onClick={addSchaden}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Weiteren Schaden hinzufügen
              </Button>

              {!kautionsanalyse && (
                <Button
                  onClick={analysiereKaution}
                  disabled={loading || !formData.kautionsbetrag}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Kaution analysieren
                    </>
                  )}
                </Button>
              )}

              {kautionsanalyse && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-purple-900">Kautionsanalyse</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      kautionsanalyse.erfolgsaussichten > 70 ? 'bg-green-100 text-green-700' :
                      kautionsanalyse.erfolgsaussichten > 40 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {kautionsanalyse.erfolgsaussichten}% Erfolgsaussichten
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Eingezahlte Kaution:</span>
                      <span className="font-semibold">{kautionsanalyse.kautiont_gesamt.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Einbehaltener Betrag:</span>
                      <span className="font-semibold text-red-600">{kautionsanalyse.einbehaltener_betrag.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-700 font-semibold">Zu fordern:</span>
                      <span className="text-xl font-bold text-green-600">{kautionsanalyse.rueckzahlungsbetrag.toFixed(2)} €</span>
                    </div>
                  </div>

                  {kautionsanalyse.probleme.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-gray-700">Erkannte Probleme:</p>
                      {kautionsanalyse.probleme.map((prob, idx) => (
                        <div key={idx} className={`p-2 rounded text-sm flex items-start gap-2 ${
                          prob.typ === 'kritisch' ? 'bg-red-100 text-red-800' :
                          prob.typ === 'stark' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {prob.text}
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
            <FormSection title="Schritt 4 von 4: Kautionsrückforderung erstellen">
              <div className="space-y-6">
                {!generatedDoc ? (
                  <>
                    <div className="space-y-3 mb-4">
                      <h4 className="font-semibold">Bankverbindung für Rückzahlung</h4>
                      <div>
                        <Label>Kontoinhaber</Label>
                        <Input
                          value={formData.rueckzahlungsbank.kontoinhaber}
                          onChange={(e) => updateNested('rueckzahlungsbank', 'kontoinhaber', e.target.value)}
                          placeholder="Anna Beispiel"
                        />
                      </div>
                      <div>
                        <Label>IBAN</Label>
                        <Input
                          value={formData.rueckzahlungsbank.iban}
                          onChange={(e) => updateNested('rueckzahlungsbank', 'iban', e.target.value)}
                          placeholder="DE89370400440532013000"
                        />
                      </div>
                    </div>

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
                            Erstelle Forderung...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-5 h-5 mr-2" />
                            Kautionsrückforderung erstellen
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Kautionsrückforderung erstellt!
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

                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded p-4">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Frist:</strong> Der Vermieter muss antworten innerhalb einer angemessenen Frist (ca. 2 Wochen).
                            Nach 6 Monaten seit Auszug verfällt sein Recht auf Einbehaltung.
                          </span>
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Zustellung:</strong> Sende die Forderung per Einschreiben mit Rückschein oder per Email mit Lesebestätigung
                            um die Zustellung zu dokumentieren.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Kautionsverwaltung vereinfachen"
              benefit="Mit Vermietify werden alle Kautionen zentral verwaltet, Rückgabefristen überwacht und Auszugsabwicklung dokumentiert."
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