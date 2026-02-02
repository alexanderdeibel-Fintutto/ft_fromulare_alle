import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, Save, AlertTriangle, CheckCircle2, DollarSign, FileText, Calendar } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function MaklergeboehrenRueckforderung() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Basisinfo
    mieter_name: '',
    makler_name: '',
    makler_adresse: '',
    wohnung: '',
    mietvertrag_geschlossen_am: '',
    
    // Schritt 2: Maklergebühren
    maklergebuehr_gezahlt: '',
    maklergebuehr_prozent: '',
    maklergebuehr_brutto: '',
    zahlungsdatum: '',
    zahlungsmethode: 'ueberweisung', // ueberweisung, bar, scheck
    
    // Schritt 3: Rechtsgrundlage
    bundesland: 'berlin', // für Maklergebührenverodnung
    wer_zahlt: 'mieter', // mieter, makler, geteilt
    zahlungsempfaenger: '', // Mieter oder Makler
    
    // Schritt 4: Zusätzliche Fakten
    makler_beratungsleistung: '',
    forderung_begruendung: '',
    versuche_einigung: false,
    versuche_einigung_datum: '',
    versuche_einigung_ergebnis: ''
  });

  const [analyseergebnis, setAnalyseergebnis] = useState(null);

  const steps = [
    'Basisinfo',
    'Gebühren',
    'Recht',
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
      updateFormData('mieter_name', currentUser.full_name || '');
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const autoSave = async () => {
    try {
      await base44.functions.invoke('saveDocument', {
        template_id: 'maklergebuehren_rueckforderung',
        document_name: `Maklergebühren-Rückforderung ${formData.wohnung || 'Entwurf'}`,
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

  const analysiereMaklergebuehr = () => {
    let analyse = {
      bundesland: formData.bundesland,
      zahlbetrag: parseFloat(formData.maklergebuehr_brutto) || 0,
      prozentsatz: parseFloat(formData.maklergebuehr_prozent) || 0,
      wer_zahlt: formData.wer_zahlt,
      probleme: [],
      chancen: [],
      rueckforderungsanspruch: false,
      geschaetzter_erfolg: 0
    };

    // Prüfe auf illegale Maklergebührenverteilung
    const bundesland_regeln = {
      berlin: { makler: 50, mieter: 50, kosten: 100 },
      hamburg: { makler: 100, mieter: 0, kosten: 100 },
      bremen: { makler: 100, mieter: 0, kosten: 100 },
      schleswig_holstein: { makler: 100, mieter: 0, kosten: 100 },
      niedersachsen: { makler: 100, mieter: 0, kosten: 100 },
      nordrhein_westfalen: { makler: 100, mieter: 0, kosten: 100 },
      hessen: { makler: 100, mieter: 0, kosten: 100 },
      rheinland_pfalz: { makler: 100, mieter: 0, kosten: 100 },
      baden_wuerttemberg: { makler: 100, mieter: 0, kosten: 100 },
      bayern: { makler: 100, mieter: 0, kosten: 100 },
      thueringen: { makler: 100, mieter: 0, kosten: 100 },
      sachsen: { makler: 100, mieter: 0, kosten: 100 },
      sachsen_anhalt: { makler: 100, mieter: 0, kosten: 100 },
      mecklenburg: { makler: 100, mieter: 0, kosten: 100 },
      brandenburg: { makler: 100, mieter: 0, kosten: 100 }
    };

    const regeln = bundesland_regeln[formData.bundesland] || bundesland_regeln.berlin;

    // Maklerprovisions-Verordnung (Makler müssen zahlen)
    if (regeln.mieter === 0 && formData.wer_zahlt === 'mieter') {
      analyse.probleme.push({
        typ: 'kritisch',
        text: `In ${formData.bundesland.toUpperCase()} muss der Makler seine Provision selbst zahlen (100/0-Regel)`
      });
      analyse.rueckforderungsanspruch = true;
      analyse.chancen.push(`Rückforderung der gesamten Gebühr in Höhe von ${analyse.zahlbetrag.toFixed(2)} €`);
      analyse.geschaetzter_erfolg = 95;
    }

    // Berlin: 50/50 Teilung - Mieter darf max 50% zahlen
    if (formData.bundesland === 'berlin' && regeln.mieter === 50 && formData.wer_zahlt === 'mieter') {
      if (formData.maklergebuehr_prozent > 50 / 100 * 2.38) { // 50% von 2,38%
        analyse.probleme.push({
          typ: 'kritisch',
          text: 'In Berlin darf der Makler nicht mehr als 50% seiner Provision vom Mieter verlangen'
        });
        analyse.rueckforderungsanspruch = true;
        
        const uebermass = analyse.zahlbetrag * 0.5;
        analyse.chancen.push(`Rückforderung des überschüssigen Anteils in Höhe von ${uebermass.toFixed(2)} €`);
        analyse.geschaetzter_erfolg = 90;
      }
    }

    // Prüfe auf fehlende Beratungsleistung
    if (!formData.makler_beratungsleistung || formData.makler_beratungsleistung.length < 10) {
      analyse.probleme.push({
        typ: 'warnung',
        text: 'Bitte dokumentieren Sie, welche Leistung der Makler erbracht hat'
      });
    }

    // Prüfe Zahlungsverjährung (3 Jahre nach Zahlung)
    if (formData.zahlungsdatum) {
      const zahlungsDatum = new Date(formData.zahlungsdatum);
      const verjAehrung = new Date(zahlungsDatum.getFullYear() + 3, zahlungsDatum.getMonth(), zahlungsDatum.getDate());
      const heute = new Date();
      
      if (heute > verjAehrung) {
        analyse.probleme.push({
          typ: 'kritisch',
          text: 'Die Rückforderung ist verjährt (3 Jahre nach Zahlung)'
        });
        analyse.geschaetzter_erfolg = 0;
      } else {
        const tage_bis_verjaehrung = Math.ceil((verjAehrung - heute) / (1000 * 60 * 60 * 24));
        analyse.empfehlungen = analyse.empfehlungen || [];
        analyse.empfehlungen.push(`Bitte beachten Sie: Rückforderungsanspruch verjährt in ${tage_bis_verjaehrung} Tagen`);
      }
    }

    setAnalyseergebnis(analyse);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.mieter_name || !formData.makler_name || !formData.wohnung || !formData.mietvertrag_geschlossen_am) {
        toast.error('Bitte alle Basisinformationen ausfüllen');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.maklergebuehr_brutto || !formData.zahlungsdatum) {
        toast.error('Bitte Gebührenangaben ausfüllen');
        return;
      }
    }

    if (currentStep === 3) {
      analysiereMaklergebuehr();
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
        template_id: 'maklergebuehren_rueckforderung',
        data: {
          mieter: {
            name: formData.mieter_name
          },
          makler: {
            name: formData.makler_name,
            adresse: formData.makler_adresse
          },
          wohnung: formData.wohnung,
          mietvertrag_geschlossen_am: formData.mietvertrag_geschlossen_am,
          gebuehr: {
            betrag: formData.maklergebuehr_brutto,
            prozent: formData.maklergebuehr_prozent,
            gezahlt_am: formData.zahlungsdatum,
            zahlungsart: formData.zahlungsmethode
          },
          rechtliche_info: {
            bundesland: formData.bundesland,
            wer_zahlt: formData.wer_zahlt,
            rechtsgrundlage: 'MaklerG / Landesregelungen'
          },
          begruendung: formData.forderung_begruendung,
          analyse: analyseergebnis,
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Rückforderungsschreiben erstellt');
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
          email: 'makler@example.com',
          name: formData.makler_name
        },
        email_template: 'maklergebuehren_rueckforderung',
        context: {
          rueckforderungsbetrag: formData.maklergebuehr_brutto,
          frist: '14 Tage'
        }
      });
      toast.success('Rückforderungsschreiben versendet');
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
            💰 Maklergebühren-Rückforderung
          </h1>
          <p className="text-gray-600">
            Fordern Sie illegal gezahlte Maklergebühren zurück
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={steps} />

        {/* Schritt 1: Basisinfo */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 4: Basisinformationen">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Mieter (Sie) *</Label>
                  <Input
                    value={formData.mieter_name}
                    onChange={(e) => updateFormData('mieter_name', e.target.value)}
                    placeholder="Anna Beispiel"
                  />
                </div>
                <div>
                  <Label>Makler *</Label>
                  <Input
                    value={formData.makler_name}
                    onChange={(e) => updateFormData('makler_name', e.target.value)}
                    placeholder="Makler GmbH"
                  />
                </div>
              </div>

              <div>
                <Label>Makler-Adresse</Label>
                <Input
                  value={formData.makler_adresse}
                  onChange={(e) => updateFormData('makler_adresse', e.target.value)}
                  placeholder="Musterstraße 1, 10115 Berlin"
                />
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
                <Label>Mietvertrag geschlossen am *</Label>
                <Input
                  type="date"
                  value={formData.mietvertrag_geschlossen_am}
                  onChange={(e) => updateFormData('mietvertrag_geschlossen_am', e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Info:</strong> In vielen Bundesländern muss der Makler seine Provision selbst zahlen. 
                    Haben Sie als Mieter Gebühren gezahlt, können Sie diese zurückfordern.
                  </span>
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Maklergebühren */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Maklergebühren">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Gezahlte Gebühr (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.maklergebuehr_brutto}
                    onChange={(e) => updateFormData('maklergebuehr_brutto', e.target.value)}
                    placeholder="2380.00"
                  />
                </div>
                <div>
                  <Label>Prozentsatz der Miete (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.maklergebuehr_prozent}
                    onChange={(e) => updateFormData('maklergebuehr_prozent', e.target.value)}
                    placeholder="2.38"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Zahlungsdatum *</Label>
                  <Input
                    type="date"
                    value={formData.zahlungsdatum}
                    onChange={(e) => updateFormData('zahlungsdatum', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Zahlungsart</Label>
                  <Select
                    value={formData.zahlungsmethode}
                    onValueChange={(val) => updateFormData('zahlungsmethode', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ueberweisung">Überweisung</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="scheck">Scheck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Was hat der Makler geleistet?</Label>
                <Textarea
                  value={formData.makler_beratungsleistung}
                  onChange={(e) => updateFormData('makler_beratungsleistung', e.target.value)}
                  rows={3}
                  placeholder="Besichtigung, Exposé, Vermittlung, Vertragsprüfung, etc."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Hinweis:</strong> Bewahren Sie alle Zahlungsbelege (Überweisungsträger, Quittungen) auf. 
                  Diese sind wichtig als Beweis.
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Rechtsgrundlage */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Rechtsgrundlage & Analyse">
            <div className="space-y-6">
              <div>
                <Label>Bundesland *</Label>
                <Select
                  value={formData.bundesland}
                  onValueChange={(val) => updateFormData('bundesland', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="berlin">Berlin (50/50)</SelectItem>
                    <SelectItem value="hamburg">Hamburg (100/0)</SelectItem>
                    <SelectItem value="bremen">Bremen (100/0)</SelectItem>
                    <SelectItem value="schleswig_holstein">Schleswig-Holstein (100/0)</SelectItem>
                    <SelectItem value="niedersachsen">Niedersachsen (100/0)</SelectItem>
                    <SelectItem value="nordrhein_westfalen">Nordrhein-Westfalen (100/0)</SelectItem>
                    <SelectItem value="hessen">Hessen (100/0)</SelectItem>
                    <SelectItem value="rheinland_pfalz">Rheinland-Pfalz (100/0)</SelectItem>
                    <SelectItem value="baden_wuerttemberg">Baden-Württemberg (100/0)</SelectItem>
                    <SelectItem value="bayern">Bayern (100/0)</SelectItem>
                    <SelectItem value="thueringen">Thüringen (100/0)</SelectItem>
                    <SelectItem value="sachsen">Sachsen (100/0)</SelectItem>
                    <SelectItem value="sachsen_anhalt">Sachsen-Anhalt (100/0)</SelectItem>
                    <SelectItem value="mecklenburg">Mecklenburg-Vorpommern (100/0)</SelectItem>
                    <SelectItem value="brandenburg">Brandenburg (100/0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Wer soll die Gebühr zahlen?</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border cursor-pointer">
                    <input
                      type="radio"
                      name="wer_zahlt"
                      value="mieter"
                      checked={formData.wer_zahlt === 'mieter'}
                      onChange={(e) => updateFormData('wer_zahlt', e.target.value)}
                    />
                    <div>
                      <div className="font-semibold text-sm">Der Mieter (ich) hat gezahlt</div>
                      <p className="text-xs text-gray-600">Das ist problematisch in den meisten Bundesländern</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border cursor-pointer">
                    <input
                      type="radio"
                      name="wer_zahlt"
                      value="makler"
                      checked={formData.wer_zahlt === 'makler'}
                      onChange={(e) => updateFormData('wer_zahlt', e.target.value)}
                    />
                    <div>
                      <div className="font-semibold text-sm">Der Makler sollte zahlen</div>
                      <p className="text-xs text-gray-600">Korrekt nach MaklerG</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <Label>Begründung der Forderung</Label>
                <Textarea
                  value={formData.forderung_begruendung}
                  onChange={(e) => updateFormData('forderung_begruendung', e.target.value)}
                  rows={3}
                  placeholder="Warum fordern Sie die Gebühr zurück? (z.B. weil in Ihrem Bundesland der Makler zahlen muss)"
                />
              </div>

              <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                <Checkbox
                  checked={formData.versuche_einigung}
                  onCheckedChange={(checked) => updateFormData('versuche_einigung', checked)}
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Haben Sie versucht, sich zu einigen?</div>
                  <p className="text-xs text-gray-600 mt-1">Dies zeigt Kulanz und kann hilfreich sein</p>
                </div>
              </label>

              {formData.versuche_einigung && (
                <div className="space-y-3 pl-8">
                  <div>
                    <Label className="text-sm">Datum des Versuchs</Label>
                    <Input
                      type="date"
                      value={formData.versuche_einigung_datum}
                      onChange={(e) => updateFormData('versuche_einigung_datum', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Ergebnis</Label>
                    <Textarea
                      value={formData.versuche_einigung_ergebnis}
                      onChange={(e) => updateFormData('versuche_einigung_ergebnis', e.target.value)}
                      rows={2}
                      placeholder="Was war das Ergebnis des Versuchs?"
                    />
                  </div>
                </div>
              )}

              {!analyseergebnis && (
                <Button
                  onClick={nextStep}
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
                      Rechtslage analysieren
                    </>
                  )}
                </Button>
              )}

              {analyseergebnis && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-purple-900">Rechtsanalyse</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      analyseergebnis.rueckforderungsanspruch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {analyseergebnis.rueckforderungsanspruch ? '✓ Anspruch besteht' : '✗ Kein Anspruch'}
                    </span>
                  </div>

                  {analyseergebnis.probleme.length > 0 && (
                    <div className="space-y-2">
                      {analyseergebnis.probleme.map((prob, idx) => (
                        <div key={idx} className={`p-3 rounded ${
                          prob.typ === 'kritisch' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <div className="text-sm">{prob.text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {analyseergebnis.chancen.length > 0 && (
                    <div className="space-y-2">
                      {analyseergebnis.chancen.map((chance, idx) => (
                        <div key={idx} className="p-3 bg-green-100 text-green-800 rounded text-sm">
                          ✓ {chance}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                    <span className="font-semibold text-purple-900">Erfolgsaussicht:</span>
                    <span className="text-2xl font-bold text-indigo-600">{analyseergebnis.geschaetzter_erfolg}%</span>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Dokument */}
        {currentStep === 4 && (
          <div>
            <FormSection title="Schritt 4 von 4: Rückforderungsschreiben">
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
                          Erstelle Schreiben...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 mr-2" />
                          Rückforderungsschreiben erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Rückforderungsschreiben erstellt!
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
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Versand:</strong> Senden Sie das Schreiben per Einschreiben mit Rückschein 
                            oder per beglaubigter Email. Setzen Sie eine Frist von mindestens 14 Tagen.
                          </span>
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Wichtig:</strong> Der Rückforderungsanspruch verjährt 3 Jahre nach Zahlung. 
                            Handeln Sie zeitnah!
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Maklergebühren automatisch überprüfen"
              benefit="Mit Vermietify werden alle Maklerverträge automatisch auf legale Gebührenregelungen überprüft."
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