import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, Save, Plus, Trash2, Info, AlertTriangle, DollarSign, Percent } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Mietminderung() {
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
    monatliche_miete: '',
    
    // Schritt 2: Mängel
    maengel: [
      {
        art: 'heizung',
        beschreibung: '',
        seit_wann: '',
        vermieter_benachrichtigt_am: '',
        behoben: false,
        behoben_am: ''
      }
    ],
    
    // Schritt 3: Berechnung
    behaeltnis_vermieterung: 'mieter', // mieter oder vermieter
    minderungsquote_gesamt: 0,
    rueckzahlung_zeitraum_von: '',
    rueckzahlung_zeitraum_bis: '',
    
    // Schritt 4: Rechtliches
    aufforderung_reparatur: false,
    aufforderung_reparatur_frist_tage: 14,
    mietminderung_ab: ''
  });

  const [minderungsanalyse, setMinderungsanalyse] = useState(null);

  const steps = [
    'Basisinfo',
    'Mängel',
    'Berechnung',
    'Dokument'
  ];

  const mangelarten = [
    { value: 'heizung', label: 'Heizung/Warmwasser', quote: 20 },
    { value: 'schimmel', label: 'Schimmel/Feuchte', quote: 15 },
    { value: 'undichtes_fenster', label: 'Undichte Fenster/Türen', quote: 10 },
    { value: 'kuehler_boden', label: 'Kalte Böden/Dämmer', quote: 10 },
    { value: 'wasser', label: 'Wasser/Abwasser-Problem', quote: 20 },
    { value: 'elektrik', label: 'Stromsperrungen/Ausfälle', quote: 20 },
    { value: 'beleuchtung', label: 'Treppenhausbeleuchtung', quote: 5 },
    { value: 'aufzug', label: 'Aufzug defekt', quote: 10 },
    { value: 'balkon_defekt', label: 'Balkon/Terrasse defekt', quote: 8 },
    { value: 'laerm', label: 'Lärmbelästigung/Baustelle', quote: 15 },
    { value: 'staub', label: 'Staub/Baustaub', quote: 10 },
    { value: 'geruchsbelestigung', label: 'Geruchsbelästigung', quote: 10 },
    { value: 'ratten', label: 'Schädlinge (Ratten/Insekten)', quote: 15 },
    { value: 'sanitaer', label: 'Sanitär-Probleme', quote: 15 },
    { value: 'kueche', label: 'Küche/Elektrogeräte', quote: 8 },
    { value: 'sonstiges', label: 'Sonstiges', quote: 5 }
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
        template_id: 'mietminderung',
        document_name: `Mietminderung ${formData.wohnung || 'Entwurf'}`,
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

  const addMangel = () => {
    setFormData(prev => ({
      ...prev,
      maengel: [...prev.maengel, {
        art: 'sonstiges',
        beschreibung: '',
        seit_wann: '',
        vermieter_benachrichtigt_am: '',
        behoben: false,
        behoben_am: ''
      }]
    }));
  };

  const removeMangel = (index) => {
    setFormData(prev => ({
      ...prev,
      maengel: prev.maengel.filter((_, i) => i !== index)
    }));
  };

  const updateMangel = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      maengel: prev.maengel.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const calculateMinderung = () => {
    const maengel_mit_quote = formData.maengel.filter(m => m.beschreibung);
    let quotes = [];
    
    maengel_mit_quote.forEach(m => {
      const mangelart = mangelarten.find(a => a.value === m.art);
      quotes.push(mangelart?.quote || 5);
    });

    // Vereinfachte Berechnung: Quote + (50% je weiterer Mangel)
    let gesamtquote = quotes[0] || 0;
    if (quotes.length > 1) {
      for (let i = 1; i < quotes.length; i++) {
        gesamtquote += quotes[i] * 0.5; // 50% kumulativ
      }
    }

    gesamtquote = Math.min(gesamtquote, 100); // max 100%

    let analyse = {
      anzahl_maengel: maengel_mit_quote.length,
      maengel: maengel_mit_quote,
      berechnete_minderungsquote: Math.round(gesamtquote),
      monatliche_miete: parseFloat(formData.monatliche_miete) || 0,
      monatliche_minderung: ((parseFloat(formData.monatliche_miete) || 0) * gesamtquote / 100).toFixed(2),
      probleme: [],
      empfehlungen: [],
      rechtlich_begruendet: true
    };

    // Prüfe auf kritische Mängel
    const kritische = formData.maengel.filter(m => 
      ['heizung', 'wasser', 'elektrik', 'ratten'].includes(m.art)
    );

    if (kritische.length > 0) {
      analyse.empfehlungen.push('Kritische Mängel erkannt - Vermieter sollte informiert sein');
      analyse.berechnete_minderungsquote = Math.min(analyse.berechnete_minderungsquote + 10, 100);
    }

    // Prüfe Dauer
    if (formData.rueckzahlung_zeitraum_von && formData.rueckzahlung_zeitraum_bis) {
      const von = new Date(formData.rueckzahlung_zeitraum_von);
      const bis = new Date(formData.rueckzahlung_zeitraum_bis);
      const monate = Math.ceil((bis - von) / (1000 * 60 * 60 * 24 * 30));
      
      const gesamtruckforderung = (analyse.monatliche_minderung * monate).toFixed(2);
      analyse.gesamtruckforderung = gesamtruckforderung;
      analyse.anzahl_monate = monate;
    }

    setMinderungsanalyse(analyse);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.mieter_name || !formData.vermieter_name || !formData.wohnung || !formData.monatliche_miete) {
        toast.error('Bitte alle Basisinformationen ausfüllen');
        return;
      }
    }

    if (currentStep === 2) {
      const hatMaengel = formData.maengel.some(m => m.beschreibung);
      if (!hatMaengel) {
        toast.error('Bitte mindestens einen Mangel eintragen');
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.rueckzahlung_zeitraum_von || !formData.rueckzahlung_zeitraum_bis) {
        toast.error('Bitte Rückzahlungszeitraum angeben');
        return;
      }
      calculateMinderung();
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
        template_id: 'mietminderung',
        data: {
          mieter: {
            name: formData.mieter_name
          },
          vermieter: {
            name: formData.vermieter_name
          },
          wohnung: formData.wohnung,
          mietbeginn: formData.mietbeginn,
          miete: {
            monatlich: formData.monatliche_miete,
            minderung: minderungsanalyse.monatliche_minderung,
            minderungsquote: minderungsanalyse.berechnete_minderungsquote
          },
          maengel: formData.maengel.filter(m => m.beschreibung),
          rueckzahlung: {
            von: formData.rueckzahlung_zeitraum_von,
            bis: formData.rueckzahlung_zeitraum_bis,
            gesamtbetrag: minderungsanalyse.gesamtruckforderung,
            anzahl_monate: minderungsanalyse.anzahl_monate
          },
          aufforderung_reparatur: formData.aufforderung_reparatur,
          frist_reparatur_tage: formData.aufforderung_reparatur_frist_tage,
          analyse: minderungsanalyse,
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Mietminderung erstellt');
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
          email: 'vermieter@example.com',
          name: formData.vermieter_name
        },
        email_template: 'mietminderung',
        context: {
          minderungsquote: minderungsanalyse.berechnete_minderungsquote,
          monatliche_minderung: minderungsanalyse.monatliche_minderung
        }
      });
      toast.success('Mietminderung versendet');
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
            📉 Mietminderung
          </h1>
          <p className="text-gray-600">
            Fordern Sie Mietminderung für Wohnungsmängel
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
                  <Label>Monatliche Miete (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.monatliche_miete}
                    onChange={(e) => updateFormData('monatliche_miete', e.target.value)}
                    placeholder="1200.00"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Was ist Mietminderung?</strong> Sie können die Miete kürzen, wenn die Wohnung Mängel hat, 
                    die den Gebrauch beeinträchtigen. Der Vermieter muss diese zeitnah beheben.
                  </span>
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Mängel */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Wohnungsmängel">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tipp:</strong> Dokumentieren Sie jeden Mangel mit Datum und Beschreibung. Fotos sind wertvoll.
                </p>
              </div>

              {formData.maengel.map((mangel, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold">Mangel {index + 1}</h4>
                    {formData.maengel.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMangel(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Art des Mangels *</Label>
                      <Select
                        value={mangel.art}
                        onValueChange={(val) => updateMangel(index, 'art', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mangelarten.map(art => (
                            <SelectItem key={art.value} value={art.value}>
                              {art.label} (~{art.quote}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Beschreibung *</Label>
                      <Textarea
                        value={mangel.beschreibung}
                        onChange={(e) => updateMangel(index, 'beschreibung', e.target.value)}
                        rows={2}
                        placeholder="Detaillierte Beschreibung des Mangels..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Mangel besteht seit</Label>
                        <Input
                          type="date"
                          value={mangel.seit_wann}
                          onChange={(e) => updateMangel(index, 'seit_wann', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Vermieter benachrichtigt am</Label>
                        <Input
                          type="date"
                          value={mangel.vermieter_benachrichtigt_am}
                          onChange={(e) => updateMangel(index, 'vermieter_benachrichtigt_am', e.target.value)}
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                      <Checkbox
                        checked={mangel.behoben}
                        onCheckedChange={(checked) => updateMangel(index, 'behoben', checked)}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Mangel wurde behoben</div>
                      </div>
                    </label>

                    {mangel.behoben && (
                      <div>
                        <Label>Behoben am</Label>
                        <Input
                          type="date"
                          value={mangel.behoben_am}
                          onChange={(e) => updateMangel(index, 'behoben_am', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Button
                onClick={addMangel}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Weiteren Mangel hinzufügen
              </Button>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Berechnung */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Berechnung & Rückzahlung">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Die Minderungsquote wird berechnet basierend auf den dokumentierten Mängeln.
                </p>
              </div>

              <div>
                <Label>Rückzahlungszeitraum - Von *</Label>
                <Input
                  type="date"
                  value={formData.rueckzahlung_zeitraum_von}
                  onChange={(e) => updateFormData('rueckzahlung_zeitraum_von', e.target.value)}
                />
              </div>

              <div>
                <Label>Rückzahlungszeitraum - Bis *</Label>
                <Input
                  type="date"
                  value={formData.rueckzahlung_zeitraum_bis}
                  onChange={(e) => updateFormData('rueckzahlung_zeitraum_bis', e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Zusätzliche Anforderungen</h4>
                
                <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                  <Checkbox
                    checked={formData.aufforderung_reparatur}
                    onCheckedChange={(checked) => updateFormData('aufforderung_reparatur', checked)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Aufforderung zur Reparatur</div>
                    <p className="text-xs text-gray-600 mt-1">Fordern Sie den Vermieter auf, die Mängel zu beheben</p>
                  </div>
                </label>

                {formData.aufforderung_reparatur && (
                  <div>
                    <Label>Reparatur-Frist (Tage)</Label>
                    <Input
                      type="number"
                      min="14"
                      value={formData.aufforderung_reparatur_frist_tage}
                      onChange={(e) => updateFormData('aufforderung_reparatur_frist_tage', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {!minderungsanalyse && (
                <Button
                  onClick={calculateMinderung}
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
                      <Percent className="w-4 h-4 mr-2" />
                      Minderung berechnen
                    </>
                  )}
                </Button>
              )}

              {minderungsanalyse && (
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-6 space-y-4">
                  <h4 className="font-bold text-lg text-orange-900">Minderungsberechnung</h4>

                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center border-b pb-3">
                      <span className="text-gray-700">Monatliche Miete:</span>
                      <span className="font-semibold">{minderungsanalyse.monatliche_miete.toFixed(2)} €</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b pb-3">
                      <span className="text-gray-700">Minderungsquote:</span>
                      <span className="text-2xl font-bold text-orange-600">{minderungsanalyse.berechnete_minderungsquote}%</span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-3">
                      <span className="text-gray-700">Monatliche Minderung:</span>
                      <span className="text-xl font-bold text-green-600">{minderungsanalyse.monatliche_minderung} €</span>
                    </div>

                    {minderungsanalyse.gesamtruckforderung && (
                      <div className="flex justify-between items-center pt-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded p-3">
                        <span className="font-semibold text-green-900">Gesamtrückforderung ({minderungsanalyse.anzahl_monate} Monate):</span>
                        <span className="text-2xl font-bold text-green-600">{minderungsanalyse.gesamtruckforderung} €</span>
                      </div>
                    )}
                  </div>

                  {minderungsanalyse.empfehlungen.length > 0 && (
                    <div className="space-y-2">
                      {minderungsanalyse.empfehlungen.map((emp, idx) => (
                        <div key={idx} className="p-2 bg-green-100 text-green-800 rounded text-sm">
                          ✓ {emp}
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
            <FormSection title="Schritt 4 von 4: Mietminderung erstellen">
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
                          Erstelle Mietminderung...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-5 h-5 mr-2" />
                          Mietminderung erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Mietminderung erstellt!
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
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Versand:</strong> Senden Sie die Mietminderung per Einschreiben oder Email mit Lesebestätigung 
                            an den Vermieter.
                          </span>
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Zahlungsweise:</strong> Sie können die Miete ab sofort um den berechneten Betrag kürzen 
                            und direkt weniger überweisen. Dokumentieren Sie die Zahlungskürzung schriftlich.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Mängel zentral verwalten"
              benefit="Mit Vermietify werden Mängelberichte automatisch verwaltet und Sie erhalten Erinnerungen zur Nachverfolgung."
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