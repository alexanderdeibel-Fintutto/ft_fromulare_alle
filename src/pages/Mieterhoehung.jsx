import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, TrendingUp, Download, Mail, Save, Info } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Mieterhoehung() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Mietverhältnis
    mieter_name: '',
    wohnung: '',
    aktuelle_kaltmiete: '',
    letzte_erhoehung: '',
    mietbeginn: '',
    
    // Schritt 2: Erhöhungsgrund
    erhoehungsgrund: 'vergleichsmiete', // vergleichsmiete, modernisierung, staffel, index
    
    // Schritt 3: Vergleichsmiete
    plz: '',
    ort: '',
    wohnflaeche: '',
    baujahr: '',
    ausstattung: 'mittel',
    lage: 'mittel',
    
    // Schritt 4: Neue Miete
    neue_miete: '',
    
    // Schritt 5: Begründung
    begruendung: '',
  });

  const [mietspiegel, setMietspiegel] = useState(null);
  const [erhoehungData, setErhoehungData] = useState(null);
  const [fristenData, setFristenData] = useState(null);

  const steps = [
    'Mieter',
    'Grund',
    'Vergleichsmiete',
    'Neue Miete',
    'Fristen',
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
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const autoSave = async () => {
    try {
      await base44.functions.invoke('saveDocument', {
        template_id: 'mieterhoehung',
        document_name: `Mieterhöhung ${formData.mieter_name || 'Entwurf'}`,
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

  const fetchMietspiegelData = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('fetchMietspiegel', {
        plz: formData.plz,
        ort: formData.ort,
        wohnung: {
          wohnflaeche: parseFloat(formData.wohnflaeche),
          baujahr: parseInt(formData.baujahr),
          ausstattung: formData.ausstattung,
          lage: formData.lage
        }
      });

      if (result.data) {
        setMietspiegel(result.data);
        toast.success('Mietspiegel erfolgreich abgerufen');
      }
    } catch (err) {
      console.error('Mietspiegel error:', err);
      toast.error('Fehler beim Abrufen des Mietspiegels');
    } finally {
      setLoading(false);
    }
  };

  const calculateErhoehung = async () => {
    setLoading(true);
    try {
      const vergleichsmiete = mietspiegel?.vergleichsmiete?.empfohlen || 0;
      const wohnflaeche = parseFloat(formData.wohnflaeche);
      
      const result = await base44.functions.invoke('calculateMieterhoehung', {
        aktuelle_miete: parseFloat(formData.aktuelle_kaltmiete),
        letzte_erhoehung: formData.letzte_erhoehung,
        ortsübliche_vergleichsmiete: vergleichsmiete * wohnflaeche,
        kappungsgrenze: 15,
        modernisierung: formData.erhoehungsgrund === 'modernisierung' ? {
          kosten: 50000,
          umlegbar: 8
        } : null
      });

      if (result.data) {
        setErhoehungData(result.data);
        updateFormData('neue_miete', result.data.empfohlene_neue_miete?.toFixed(2) || '');
        toast.success('Mieterhöhung berechnet');
      }
    } catch (err) {
      console.error('Calculate error:', err);
      toast.error('Fehler bei der Berechnung');
    } finally {
      setLoading(false);
    }
  };

  const calculateFristen = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('calculateFristen', {
        frist_typ: 'mieterhoehung_zustimmung',
        stichtag: new Date().toISOString(),
        mietverhaeltnis_seit: formData.mietbeginn
      });

      if (result.data) {
        setFristenData(result.data);
        toast.success('Fristen berechnet');
      }
    } catch (err) {
      console.error('Fristen error:', err);
      toast.error('Fehler bei der Fristenberechnung');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!formData.mieter_name || !formData.aktuelle_kaltmiete) {
        toast.error('Bitte alle Pflichtfelder ausfüllen');
        return;
      }
    }

    if (currentStep === 3 && formData.erhoehungsgrund === 'vergleichsmiete') {
      if (!formData.plz || !formData.wohnflaeche) {
        toast.error('Bitte Objektdaten eingeben');
        return;
      }
      if (!mietspiegel) {
        await fetchMietspiegelData();
        return;
      }
    }

    if (currentStep === 4) {
      if (!erhoehungData) {
        await calculateErhoehung();
        return;
      }
    }

    if (currentStep === 5) {
      if (!fristenData) {
        await calculateFristen();
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generateDocument = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'mieterhoehung',
        data: {
          vermieter: {
            name: user?.full_name || 'Max Mustermann',
          },
          mieter: {
            name: formData.mieter_name,
            wohnung: formData.wohnung,
          },
          aktuelle_miete: formData.aktuelle_kaltmiete,
          neue_miete: formData.neue_miete,
          erhoehung: {
            betrag: parseFloat(formData.neue_miete) - parseFloat(formData.aktuelle_kaltmiete),
            prozent: ((parseFloat(formData.neue_miete) - parseFloat(formData.aktuelle_kaltmiete)) / parseFloat(formData.aktuelle_kaltmiete) * 100).toFixed(2)
          },
          grund: formData.erhoehungsgrund,
          begruendung: formData.begruendung,
          mietspiegel: mietspiegel,
          fristen: fristenData,
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Dokument erfolgreich erstellt');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen des Dokuments');
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
        email_template: 'mieterhoehung',
        context: {
          neue_miete: formData.neue_miete,
          datum: fristenData?.wirksam_ab || ''
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
            📈 Mieterhöhung erstellen
          </h1>
          <p className="text-gray-600">
            Erstelle ein rechtssicheres Mieterhöhungsverlangen mit automatischer Fristberechnung
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={6} steps={steps} />

        {/* Schritt 1: Mietverhältnis */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 6: Mietverhältnis auswählen">
            <div className="space-y-4">
              <div>
                <Label>Mieter *</Label>
                <Input
                  value={formData.mieter_name}
                  onChange={(e) => updateFormData('mieter_name', e.target.value)}
                  placeholder="Anna Beispiel"
                />
              </div>

              <div>
                <Label>Wohnung</Label>
                <Input
                  value={formData.wohnung}
                  onChange={(e) => updateFormData('wohnung', e.target.value)}
                  placeholder="Musterstraße 10, 3. OG links"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Aktuelle Kaltmiete (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.aktuelle_kaltmiete}
                    onChange={(e) => updateFormData('aktuelle_kaltmiete', e.target.value)}
                    placeholder="750.00"
                  />
                </div>
                <div>
                  <Label>Letzte Erhöhung am</Label>
                  <Input
                    type="date"
                    value={formData.letzte_erhoehung}
                    onChange={(e) => updateFormData('letzte_erhoehung', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Mietbeginn</Label>
                <Input
                  type="date"
                  value={formData.mietbeginn}
                  onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                />
              </div>

              {formData.aktuelle_kaltmiete && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Aktuelle Kaltmiete:</span>
                      <span className="font-semibold">{parseFloat(formData.aktuelle_kaltmiete).toFixed(2)} €</span>
                    </div>
                    {formData.letzte_erhoehung && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Letzte Erhöhung:</span>
                        <span className="font-semibold">{new Date(formData.letzte_erhoehung).toLocaleDateString('de-DE')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Erhöhungsgrund */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 6: Art der Mieterhöhung">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="erhoehungsgrund"
                    value="vergleichsmiete"
                    checked={formData.erhoehungsgrund === 'vergleichsmiete'}
                    onChange={(e) => updateFormData('erhoehungsgrund', e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Anpassung an ortsübliche Vergleichsmiete (§ 558 BGB)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Begründung über Mietspiegel, Vergleichswohnungen oder Gutachten
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="erhoehungsgrund"
                    value="modernisierung"
                    checked={formData.erhoehungsgrund === 'modernisierung'}
                    onChange={(e) => updateFormData('erhoehungsgrund', e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Nach Modernisierung (§ 559 BGB)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Bis zu 8% der Modernisierungskosten pro Jahr umlegbar
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="erhoehungsgrund"
                    value="staffel"
                    checked={formData.erhoehungsgrund === 'staffel'}
                    onChange={(e) => updateFormData('erhoehungsgrund', e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Staffelmiete (vereinbart)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Automatische Erhöhung laut Mietvertrag
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="erhoehungsgrund"
                    value="index"
                    checked={formData.erhoehungsgrund === 'index'}
                    onChange={(e) => updateFormData('erhoehungsgrund', e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Indexmiete (vereinbart)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Anpassung an Verbraucherpreisindex
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Vergleichsmiete ermitteln */}
        {currentStep === 3 && formData.erhoehungsgrund === 'vergleichsmiete' && (
          <FormSection title="Schritt 3 von 6: Vergleichsmiete ermitteln">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>PLZ *</Label>
                  <Input
                    value={formData.plz}
                    onChange={(e) => updateFormData('plz', e.target.value)}
                    placeholder="10115"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Ort *</Label>
                  <Input
                    value={formData.ort}
                    onChange={(e) => updateFormData('ort', e.target.value)}
                    placeholder="Berlin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Wohnfläche (m²) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.wohnflaeche}
                    onChange={(e) => updateFormData('wohnflaeche', e.target.value)}
                    placeholder="75"
                  />
                </div>
                <div>
                  <Label>Baujahr</Label>
                  <Input
                    type="number"
                    value={formData.baujahr}
                    onChange={(e) => updateFormData('baujahr', e.target.value)}
                    placeholder="1985"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ausstattung</Label>
                  <Select
                    value={formData.ausstattung}
                    onValueChange={(val) => updateFormData('ausstattung', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="einfach">Einfach</SelectItem>
                      <SelectItem value="mittel">Mittel</SelectItem>
                      <SelectItem value="gehoben">Gehoben</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lage</Label>
                  <Select
                    value={formData.lage}
                    onValueChange={(val) => updateFormData('lage', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="einfach">Einfach</SelectItem>
                      <SelectItem value="mittel">Mittel</SelectItem>
                      <SelectItem value="gut">Gut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!mietspiegel && (
                <Button
                  onClick={fetchMietspiegelData}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Lade Mietspiegel...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Mietspiegel abrufen
                    </>
                  )}
                </Button>
              )}

              {mietspiegel && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Mietspiegel für {mietspiegel.ort}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Untere Spanne:</span>
                      <span className="font-semibold">
                        {mietspiegel.vergleichsmiete?.unteres_drittel?.toFixed(2)} €/m²
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Mittelfeld:</span>
                      <span className="font-semibold text-lg">
                        {mietspiegel.vergleichsmiete?.mittleres_feld?.toFixed(2)} €/m²
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Obere Spanne:</span>
                      <span className="font-semibold">
                        {mietspiegel.vergleichsmiete?.oberes_drittel?.toFixed(2)} €/m²
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">Empfohlene Miete/m²:</span>
                        <span className="text-xl font-bold text-indigo-600">
                          {mietspiegel.vergleichsmiete?.empfohlen?.toFixed(2)} €/m²
                        </span>
                      </div>
                      {formData.wohnflaeche && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-700 font-semibold">Gesamt-Miete:</span>
                          <span className="text-xl font-bold text-indigo-600">
                            {(mietspiegel.vergleichsmiete?.empfohlen * parseFloat(formData.wohnflaeche)).toFixed(2)} €
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="bg-blue-100 rounded p-3 mt-4">
                      <p className="text-xs text-blue-800">
                        <Info className="w-4 h-4 inline mr-1" />
                        Einordnung: {mietspiegel.einordnung || 'Mittleres Segment'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Neue Miete berechnen */}
        {currentStep === 4 && (
          <FormSection title="Schritt 4 von 6: Neue Miete berechnen">
            <div className="space-y-4">
              {!erhoehungData && (
                <div className="text-center py-8">
                  <Button
                    onClick={calculateErhoehung}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Berechne...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Mieterhöhung berechnen
                      </>
                    )}
                  </Button>
                </div>
              )}

              {erhoehungData && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-indigo-900 mb-4 text-center">
                      BERECHNUNGSERGEBNIS
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-700">Aktuelle Miete:</span>
                        <span className="font-semibold">{parseFloat(formData.aktuelle_kaltmiete).toFixed(2)} €</span>
                      </div>
                      
                      {erhoehungData.kappungsgrenze_erreicht && (
                        <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                          <p className="text-sm text-yellow-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Kappungsgrenze beachtet: Max. {erhoehungData.max_erhoehung_prozent}% in 3 Jahren
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-700">Max. mögliche Erhöhung:</span>
                        <span className="font-semibold text-red-600">
                          +{erhoehungData.max_erhoehung?.toFixed(2)} €
                        </span>
                      </div>
                      
                      <div className="border-t-2 border-indigo-300 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xl text-gray-900 font-semibold">Empfohlene neue Miete:</span>
                          <span className="text-3xl font-bold text-indigo-600">
                            {erhoehungData.empfohlene_neue_miete?.toFixed(2)} €
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-600 mt-1">
                          (+{((erhoehungData.empfohlene_neue_miete - parseFloat(formData.aktuelle_kaltmiete)) / parseFloat(formData.aktuelle_kaltmiete) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    {erhoehungData.warnungen && erhoehungData.warnungen.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {erhoehungData.warnungen.map((warnung, idx) => (
                          <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <p className="text-sm text-yellow-800 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              {warnung}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Gewünschte neue Miete (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.neue_miete}
                      onChange={(e) => updateFormData('neue_miete', e.target.value)}
                      placeholder={erhoehungData.empfohlene_neue_miete?.toFixed(2)}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Maximal zulässig: {erhoehungData.max_neue_miete?.toFixed(2)} €
                    </p>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 5: Fristen */}
        {currentStep === 5 && (
          <FormSection title="Schritt 5 von 6: Fristen & Wirksamkeit">
            <div className="space-y-4">
              {!fristenData && (
                <div className="text-center py-8">
                  <Button
                    onClick={calculateFristen}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Berechne Fristen...
                      </>
                    ) : (
                      'Fristen berechnen'
                    )}
                  </Button>
                </div>
              )}

              {fristenData && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">Rechtliche Fristen</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Früheste Zustellung:</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {new Date().toLocaleDateString('de-DE')}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Zustimmungsfrist (bis):</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {fristenData.frist_ende ? new Date(fristenData.frist_ende).toLocaleDateString('de-DE') : '-'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          (2 Monate nach Zugang)
                        </div>
                      </div>

                      <div className="bg-indigo-100 rounded-lg p-4">
                        <div className="text-sm text-indigo-700 mb-1">Wirksam ab:</div>
                        <div className="text-xl font-bold text-indigo-900">
                          {fristenData.wirksam_ab ? new Date(fristenData.wirksam_ab).toLocaleDateString('de-DE') : '-'}
                        </div>
                        <div className="text-xs text-indigo-600 mt-1">
                          (3. Monat nach Zugang)
                        </div>
                      </div>
                    </div>

                    {fristenData.hinweis && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {fristenData.hinweis}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Begründung der Mieterhöhung</Label>
                    <Textarea
                      value={formData.begruendung}
                      onChange={(e) => updateFormData('begruendung', e.target.value)}
                      rows={6}
                      placeholder="Begründung gemäß Mietspiegel..."
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Die Begründung muss die Erhöhung nachvollziehbar darlegen (z.B. Verweis auf Mietspiegel).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 6: Dokument */}
        {currentStep === 6 && (
          <div>
            <FormSection title="Schritt 6 von 6: Dokument erstellen">
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
                          Erstelle Dokument...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Mieterhöhung erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Mieterhöhung erfolgreich erstellt!
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

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                      <p className="text-sm text-yellow-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Wichtig:</strong> Das Schreiben muss dem Mieter nachweisbar zugehen (z.B. Einschreiben mit Rückschein).
                          Die Fristen beginnen erst mit Zugang!
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Mieterhöhungen automatisch verwalten"
              benefit="Mit Vermietify werden Mieterhöhungen automatisch auf Basis aktueller Mietspiegel vorgeschlagen und Fristen überwacht."
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
            disabled={loading || (currentStep === 6 && !generatedDoc)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentStep === 6 ? (
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