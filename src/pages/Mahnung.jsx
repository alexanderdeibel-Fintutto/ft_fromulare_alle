import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, AlertCircle, AlertTriangle, Download, Mail, Save, Plus, Trash2 } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Mahnung() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Mieter & Posten
    mieter_name: '',
    mieter_email: '',
    mieter_adresse: '',
    offene_posten: [
      { bezeichnung: '', faellig: '', betrag: '', ausgewaehlt: true }
    ],
    
    // Schritt 2: Mahnstufe
    mahnstufe: 2, // 1=Erinnerung, 2=1.Mahnung, 3=Letzte Mahnung
    
    // Schritt 3: Beträge
    mahngebuehr: '',
    verzugszinsen: '',
    frist_tage: 14,
    
    // Schritt 4: Text
    individueller_text: '',
  });

  const steps = [
    'Offene Posten',
    'Mahnstufe',
    'Beträge',
    'Dokument'
  ];

  const mahnstufen = {
    1: {
      name: 'Zahlungserinnerung',
      beschreibung: 'Freundlicher Ton, keine Mahngebühren',
      ton: 'freundlich',
      mahngebuehr: 0,
      frist: 14,
      farbe: 'blue',
      text: 'Sicherlich haben Sie nur vergessen, die fälligen Beträge zu überweisen. Wir bitten Sie höflich, die offenen Beträge zeitnah zu begleichen.'
    },
    2: {
      name: '1. Mahnung',
      beschreibung: 'Bestimmter Ton, Verzugszinsen beginnen',
      ton: 'bestimmt',
      mahngebuehr: 5,
      frist: 14,
      farbe: 'yellow',
      text: 'Trotz Fälligkeit ist der unten aufgeführte Betrag noch nicht bei uns eingegangen. Wir fordern Sie hiermit auf, den ausstehenden Betrag innerhalb von 14 Tagen zu begleichen.'
    },
    3: {
      name: 'Letzte Mahnung',
      beschreibung: 'Mit Kündigungsandrohung',
      ton: 'eindringlich',
      mahngebuehr: 10,
      frist: 7,
      farbe: 'red',
      text: 'Trotz mehrfacher Aufforderung ist der unten aufgeführte Betrag noch immer nicht beglichen. Dies ist Ihre letzte Mahnung. Bei weiterem Zahlungsverzug sind wir gezwungen, rechtliche Schritte einzuleiten, einschließlich einer fristlosen Kündigung des Mietverhältnisses.'
    }
  };

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

  useEffect(() => {
    // Mahngebühr automatisch setzen bei Stufenwechsel
    const stufe = mahnstufen[formData.mahnstufe];
    if (stufe) {
      updateFormData('mahngebuehr', stufe.mahngebuehr.toString());
      updateFormData('frist_tage', stufe.frist);
    }
  }, [formData.mahnstufe]);

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
        template_id: 'mahnung',
        document_name: `Mahnung ${formData.mieter_name || 'Entwurf'}`,
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

  const addPosten = () => {
    setFormData(prev => ({
      ...prev,
      offene_posten: [...prev.offene_posten, { bezeichnung: '', faellig: '', betrag: '', ausgewaehlt: true }]
    }));
  };

  const removePosten = (index) => {
    setFormData(prev => ({
      ...prev,
      offene_posten: prev.offene_posten.filter((_, i) => i !== index)
    }));
  };

  const updatePosten = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      offene_posten: prev.offene_posten.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const calculateVerzugszinsen = () => {
    // Basiszinssatz + 5 Prozentpunkte (§ 288 BGB)
    const basiszinssatz = -0.88; // Stand 2024/2025
    const verzugszinssatz = basiszinssatz + 5;
    
    const ausgewaehltePosten = formData.offene_posten.filter(p => p.ausgewaehlt && parseFloat(p.betrag) > 0);
    let gesamtZinsen = 0;
    
    ausgewaehltePosten.forEach(posten => {
      if (posten.faellig) {
        const faelligDate = new Date(posten.faellig);
        const heute = new Date();
        const tageVerzug = Math.max(0, Math.floor((heute - faelligDate) / (1000 * 60 * 60 * 24)));
        
        if (tageVerzug > 0) {
          const betrag = parseFloat(posten.betrag);
          const zinsen = (betrag * verzugszinssatz / 100 / 365) * tageVerzug;
          gesamtZinsen += zinsen;
        }
      }
    });
    
    return gesamtZinsen.toFixed(2);
  };

  const calculateGesamtforderung = () => {
    const hauptforderung = formData.offene_posten
      .filter(p => p.ausgewaehlt)
      .reduce((sum, p) => sum + (parseFloat(p.betrag) || 0), 0);
    
    const mahngebuehr = parseFloat(formData.mahngebuehr) || 0;
    const zinsen = parseFloat(formData.verzugszinsen) || 0;
    
    return {
      hauptforderung: hauptforderung.toFixed(2),
      mahngebuehr: mahngebuehr.toFixed(2),
      zinsen: zinsen.toFixed(2),
      gesamt: (hauptforderung + mahngebuehr + zinsen).toFixed(2)
    };
  };

  const checkKuendigungsgrund = () => {
    const hauptforderung = parseFloat(calculateGesamtforderung().hauptforderung);
    const monatskaltmiete = 1000; // Sollte aus Mietvertrag kommen
    
    if (hauptforderung >= monatskaltmiete * 2) {
      return {
        kuendigungMoeglich: true,
        hinweis: '⚠️ Bei Rückstand von mindestens 2 Monatsmieten ist eine fristlose Kündigung möglich (§ 543 Abs. 2 Nr. 3 BGB)!'
      };
    }
    return { kuendigungMoeglich: false };
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const hatAusgewaehltePosten = formData.offene_posten.some(p => p.ausgewaehlt && parseFloat(p.betrag) > 0);
      if (!hatAusgewaehltePosten) {
        toast.error('Bitte mindestens einen offenen Posten auswählen');
        return;
      }
      if (!formData.mieter_name) {
        toast.error('Bitte Mieter angeben');
        return;
      }
    }

    if (currentStep === 3) {
      // Verzugszinsen berechnen falls leer
      if (!formData.verzugszinsen) {
        const zinsen = calculateVerzugszinsen();
        updateFormData('verzugszinsen', zinsen);
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
      const stufe = mahnstufen[formData.mahnstufe];
      const forderung = calculateGesamtforderung();
      const fristDatum = new Date();
      fristDatum.setDate(fristDatum.getDate() + formData.frist_tage);

      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'mahnung',
        data: {
          vermieter: {
            name: user?.full_name || 'Max Mustermann',
          },
          mieter: {
            name: formData.mieter_name,
            email: formData.mieter_email,
            adresse: formData.mieter_adresse,
          },
          mahnstufe: {
            stufe: formData.mahnstufe,
            name: stufe.name,
            text: formData.individueller_text || stufe.text,
          },
          offene_posten: formData.offene_posten.filter(p => p.ausgewaehlt),
          forderung: forderung,
          frist: {
            tage: formData.frist_tage,
            datum: fristDatum.toISOString().split('T')[0]
          },
          datum: new Date().toISOString().split('T')[0],
          kuendigungshinweis: formData.mahnstufe === 3 ? checkKuendigungsgrund() : null
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Mahnung erfolgreich erstellt');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen der Mahnung');
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
          email: formData.mieter_email,
          name: formData.mieter_name
        },
        email_template: 'mahnung',
        context: {
          mahnstufe: mahnstufen[formData.mahnstufe].name,
          betrag: calculateGesamtforderung().gesamt
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

  const stufe = mahnstufen[formData.mahnstufe];
  const forderung = calculateGesamtforderung();
  const kuendigungsCheck = checkKuendigungsgrund();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚠️ Mahnung / Zahlungserinnerung erstellen
          </h1>
          <p className="text-gray-600">
            Erstelle eine Zahlungserinnerung oder Mahnung in 3 Stufen
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={steps} />

        {/* Schritt 1: Offene Posten */}
        {currentStep === 1 && (
          <div>
            <FormSection title="Schritt 1 von 4: Mieter & Offene Posten">
              <div className="space-y-6">
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
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.mieter_email}
                      onChange={(e) => updateFormData('mieter_email', e.target.value)}
                      placeholder="mieter@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label>Anschrift</Label>
                  <Input
                    value={formData.mieter_adresse}
                    onChange={(e) => updateFormData('mieter_adresse', e.target.value)}
                    placeholder="Musterstraße 10, 3. OG links"
                  />
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Offene Posten</h4>
                  
                  <div className="space-y-3">
                    {formData.offene_posten.map((posten, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-lg border">
                        <div className="col-span-1 flex items-center">
                          <Checkbox
                            checked={posten.ausgewaehlt}
                            onCheckedChange={(checked) => updatePosten(index, 'ausgewaehlt', checked)}
                          />
                        </div>
                        <div className="col-span-4">
                          <Label className="text-xs">Forderung</Label>
                          <Input
                            value={posten.bezeichnung}
                            onChange={(e) => updatePosten(index, 'bezeichnung', e.target.value)}
                            placeholder="z.B. Miete Januar 2026"
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Fällig am</Label>
                          <Input
                            type="date"
                            value={posten.faellig}
                            onChange={(e) => updatePosten(index, 'faellig', e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Betrag (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={posten.betrag}
                            onChange={(e) => updatePosten(index, 'betrag', e.target.value)}
                            placeholder="0.00"
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePosten(index)}
                            className="h-9 w-9"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPosten}
                    className="w-full mt-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Weiterer Posten
                  </Button>

                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="text-right">
                      <span className="text-gray-600">Summe offene Posten:</span>
                      <span className="ml-3 text-2xl font-bold text-red-600">
                        {forderung.hauptforderung} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {/* Schritt 2: Mahnstufe */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Mahnstufe wählen">
            <div className="space-y-4">
              {[1, 2, 3].map((stufeNr) => {
                const s = mahnstufen[stufeNr];
                return (
                  <label
                    key={stufeNr}
                    className={`flex items-start gap-4 p-5 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      formData.mahnstufe === stufeNr ? `border-${s.farbe}-500 bg-${s.farbe}-50` : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mahnstufe"
                      value={stufeNr}
                      checked={formData.mahnstufe === stufeNr}
                      onChange={(e) => updateFormData('mahnstufe', parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-gray-900">Stufe {stufeNr}: {s.name}</span>
                        {stufeNr === 1 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Freundlich</span>}
                        {stufeNr === 2 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Bestimmt</span>}
                        {stufeNr === 3 && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Eindringlich</span>}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{s.beschreibung}</div>
                      <div className="text-sm space-y-1">
                        <div>Fristsetzung: <strong>{s.frist} Tage</strong></div>
                        <div>Mahngebühr: <strong>{s.mahngebuehr > 0 ? `${s.mahngebuehr.toFixed(2)} €` : 'keine'}</strong></div>
                        {stufeNr === 3 && kuendigungsCheck.kuendigungMoeglich && (
                          <div className="bg-red-100 border border-red-300 rounded p-2 mt-2 text-red-800 text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {kuendigungsCheck.hinweis}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Beträge & Zinsen */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Beträge & Verzugszinsen">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Forderungsübersicht</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-700">Hauptforderung:</span>
                    <span className="font-semibold">{forderung.hauptforderung} €</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Mahngebühr:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.mahngebuehr}
                        onChange={(e) => updateFormData('mahngebuehr', e.target.value)}
                        className="w-28 h-9 text-right"
                      />
                      <span>€</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-700">Verzugszinsen:</span>
                      <div className="text-xs text-gray-500">Basiszins + 5% p.a.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.verzugszinsen}
                        onChange={(e) => updateFormData('verzugszinsen', e.target.value)}
                        className="w-28 h-9 text-right"
                      />
                      <span>€</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateFormData('verzugszinsen', calculateVerzugszinsen())}
                      >
                        Berechnen
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t-2 border-gray-400 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">GESAMTFORDERUNG:</span>
                      <span className="text-3xl font-bold text-red-600">{forderung.gesamt} €</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Zahlungsfrist (Tage)</Label>
                <Input
                  type="number"
                  value={formData.frist_tage}
                  onChange={(e) => updateFormData('frist_tage', e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Fällig bis: {new Date(Date.now() + formData.frist_tage * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}
                </p>
              </div>

              <div>
                <Label>Individueller Text (optional)</Label>
                <Textarea
                  value={formData.individueller_text}
                  onChange={(e) => updateFormData('individueller_text', e.target.value)}
                  rows={5}
                  placeholder={stufe.text}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Leer lassen für Standardtext
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Verzugszinsen können erst ab Eintritt des Verzugs (nach Mahnung oder Fälligkeitsdatum) 
                  geltend gemacht werden. Die Höhe beträgt Basiszinssatz + 5 Prozentpunkte p.a. (§ 288 BGB).
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Dokument */}
        {currentStep === 4 && (
          <div>
            <FormSection title="Schritt 4 von 4: Mahnung erstellen">
              <div className="space-y-6">
                {!generatedDoc ? (
                  <div className="text-center py-8">
                    <div className="mb-6 bg-gray-50 rounded-lg p-6 text-left">
                      <h4 className="font-semibold mb-3">Zusammenfassung</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Mahnstufe:</span>
                          <span className="font-semibold">{stufe.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mieter:</span>
                          <span className="font-semibold">{formData.mieter_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gesamtforderung:</span>
                          <span className="font-semibold text-red-600">{forderung.gesamt} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Zahlungsfrist:</span>
                          <span className="font-semibold">{formData.frist_tage} Tage</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={generateDocument}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Erstelle Mahnung...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Mahnung erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Mahnung erfolgreich erstellt!
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
                        disabled={loading || !formData.mieter_email}
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
                          <strong>Wichtig:</strong> Das Mahnschreiben sollte nachweisbar zugestellt werden 
                          (z.B. Einschreiben). Dokumentiere das Datum des Zugangs für eventuelle rechtliche Schritte.
                        </span>
                      </p>
                    </div>

                    {formData.mahnstufe === 3 && kuendigungsCheck.kuendigungMoeglich && (
                      <div className="bg-red-50 border border-red-200 rounded p-4">
                        <p className="text-sm text-red-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Rechtlicher Hinweis:</strong> Bei einem Mietrückstand von mindestens 2 Monatsmieten 
                            kannst du das Mietverhältnis fristlos kündigen (§ 543 Abs. 2 Nr. 3 BGB). 
                            Konsultiere ggf. einen Rechtsanwalt vor diesem Schritt.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Mahnungen automatisch versenden"
              benefit="Mit Vermietify werden Zahlungserinnerungen automatisch versendet und Mahnungen bei Bedarf eskaliert."
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