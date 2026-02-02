import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Download, Mail, Save, TrendingUp, Scale, BookOpen, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function MieterhoehunsWiderspruch() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Basisinfo
    mieter_name: '',
    vermieter_name: '',
    wohnung: '',
    
    // Schritt 2: Mieterhöhung Details
    aktuelle_miete: '',
    neue_miete: '',
    erhoehungsbetrag: '',
    mietbeginn: '',
    kuendigungsdatum: '',
    wirksam_ab: '',
    kuendigungsfrist_eingehalten: 'ja',
    
    // Schritt 3: Rechtliche Gründe
    einspruchsgruende: [], // mehrfachauswahl möglich
    
    // Detaillierte Begründungen
    mietspiegel_vergleich: {
      genutzt: false,
      vergleichsmiete: '',
      vergleichsort: '',
      davon_abweichung: ''
    },
    kappungsgrenze: {
      geprueft: false,
      innerhalb_grenze: true,
      prozentsatz: '',
      errechnet_maximum: ''
    },
    modernisierungsmangel: {
      vorhanden: false,
      maengel_beschreibung: ''
    },
    formale_fehler: {
      vorhanden: false,
      fehler_beschreibung: ''
    },
    
    // Schritt 4: Beweis & Dokumente
    beweise: [],
    
    // Schritt 5: Fristsetzung
    widerspruchsfrist_tage: 30
  });

  const [widerspruchsanalyse, setWiderspruchsanalyse] = useState(null);
  const [mietspiegel, setMietspiegel] = useState(null);

  const steps = [
    'Basisinfo',
    'Mieterhöhung',
    'Gründe',
    'Dokument'
  ];

  const einspruchsgruendeOptions = [
    {
      value: 'mietspiegel',
      label: 'Überschreitung des örtlichen Mietspiegels',
      beschreibung: 'Die Miete nach Erhöhung übersteigt vergleichbare Wohnungen im Umkreis'
    },
    {
      value: 'kappungsgrenze',
      label: 'Überschreitung der Kappungsgrenze (§ 558 BGB)',
      beschreibung: 'Erhöhung überschreitet 20% oder 3€/m² pro Jahr'
    },
    {
      value: 'maengel',
      label: 'Mängel der Wohnung (Erhöhung bei Mängeln unwirksam)',
      beschreibung: 'Erhebliche Mängel reduzieren Mietwert'
    },
    {
      value: 'modernisierung_abzug',
      label: 'Zu hohe Modernisierungsumlage',
      beschreibung: 'Modernisierungsumlagensatz übersteigt 8% der Kosten'
    },
    {
      value: 'formale_fehler',
      label: 'Formale Fehler der Erhöhung',
      beschreibung: 'Kündigungsfrist nicht eingehalten oder Schreiben fehlerhaft'
    },
    {
      value: 'keine_marktpreise',
      label: 'Vergleichbare Wohnungen günstiger',
      beschreibung: 'Gute Marktkenntnisse zeigen niedrigere Preise'
    }
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
        template_id: 'mieterhoehung_widerspruch',
        document_name: `Widerspruch Mieterhöhung ${formData.wohnung || 'Entwurf'}`,
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

  const toggleGrund = (grund) => {
    setFormData(prev => ({
      ...prev,
      einspruchsgruende: prev.einspruchsgruende.includes(grund)
        ? prev.einspruchsgruende.filter(g => g !== grund)
        : [...prev.einspruchsgruende, grund]
    }));
  };

  const berechneErhoehung = () => {
    const alt = parseFloat(formData.aktuelle_miete) || 0;
    const neu = parseFloat(formData.neue_miete) || 0;
    const diff = neu - alt;
    updateFormData('erhoehungsbetrag', diff.toFixed(2));
  };

  const analysiereWiderspruch = async () => {
    setLoading(true);
    try {
      const alt = parseFloat(formData.aktuelle_miete) || 0;
      const neu = parseFloat(formData.neue_miete) || 0;
      const erhoehung = neu - alt;
      const erhoehungsquote = ((erhoehung / alt) * 100).toFixed(2);

      let erfolgsaussichten = {
        punkte: 0,
        gruende: [],
        risiken: []
      };

      // Check Kappungsgrenze (20% in 3 Jahren)
      const abstand = new Date(formData.kuendigungsdatum) - new Date(formData.mietbeginn);
      const jahre = abstand / (1000 * 60 * 60 * 24 * 365.25);
      const maxErhoehu= (jahre <= 3) ? 0.20 : 1;

      if (erhoehungsquote > maxErhoehu * 100) {
        erfolgsaussichten.punkte += 40;
        erfolgsaussichten.gruende.push({
          typ: 'stark',
          text: 'Kappungsgrenze überschritten: Erhöhung um ' + erhoehungsquote + '% übersteigt ' + (maxErhoehu * 100) + '%-Grenze'
        });
      }

      // Check Kündigungsfrist
      if (formData.kuendigungsfrist_eingehalten === 'nein') {
        erfolgsaussichten.punkte += 50;
        erfolgsaussichten.gruende.push({
          typ: 'kritisch',
          text: 'Kündigungsfrist nicht eingehalten - Erhöhung ist unwirksam!'
        });
      }

      // Check Mängel
      if (formData.modernisierungsmangel.vorhanden) {
        erfolgsaussichten.punkte += 30;
        erfolgsaussichten.gruende.push({
          typ: 'mittel',
          text: 'Erhebliche Mängel vorhanden - Mietwert reduziert'
        });
      }

      // Check Mietspiegel
      if (formData.mietspiegel_vergleich.genutzt) {
        const vergleich = parseFloat(formData.mietspiegel_vergleich.vergleichsmiete) || 0;
        if (neu > vergleich * 1.2) {
          erfolgsaussichten.punkte += 25;
          erfolgsaussichten.gruende.push({
            typ: 'mittel',
            text: 'Neue Miete um ' + (((neu - vergleich) / vergleich * 100).toFixed(1)) + '% über Mietspiegel'
          });
        }
      }

      // Risiken
      if (erhoehungsquote < 10) {
        erfolgsaussichten.risiken.push('Erhöhung ist relativ moderat - Gericht könnte weniger geneigt sein');
      }

      setWiderspruchsanalyse({
        punkte: erfolgsaussichten.punkte,
        erfolgsaussichten: erfolgsaussichten.punkte > 60 ? 'hoch' : erfolgsaussichten.punkte > 30 ? 'mittel' : 'niedrig',
        gruende: erfolgsaussichten.gruende,
        risiken: erfolgsaussichten.risiken
      });

      toast.success('Widerspruchsanalyse durchgeführt');
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Fehler bei der Analyse');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.mieter_name || !formData.vermieter_name || !formData.wohnung) {
        toast.error('Bitte alle Basisinformationen ausfüllen');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.aktuelle_miete || !formData.neue_miete || !formData.kuendigungsdatum) {
        toast.error('Bitte Mieterhöhung Details ausfüllen');
        return;
      }
      berechneErhoehung();
    }

    if (currentStep === 3) {
      if (formData.einspruchsgruende.length === 0) {
        toast.error('Bitte mindestens einen Widerspruchsgrund auswählen');
        return;
      }
      analysiereWiderspruch();
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
        template_id: 'mieterhoehung_widerspruch',
        data: {
          mieter: {
            name: formData.mieter_name,
          },
          vermieter: {
            name: formData.vermieter_name,
          },
          wohnung: formData.wohnung,
          mietverhaeltnis: {
            mietbeginn: formData.mietbeginn
          },
          mietverhoehung: {
            aktuelle_miete: formData.aktuelle_miete,
            neue_miete: formData.neue_miete,
            erhoehung_betrag: formData.erhoehungsbetrag,
            erhoehung_prozent: (((parseFloat(formData.neue_miete) - parseFloat(formData.aktuelle_miete)) / parseFloat(formData.aktuelle_miete)) * 100).toFixed(2),
            kuendigungsdatum: formData.kuendigungsdatum,
            wirksam_ab: formData.wirksam_ab
          },
          widerspruch: {
            gruende: formData.einspruchsgruende,
            mietspiegel: formData.mietspiegel_vergleich.genutzt ? formData.mietspiegel_vergleich : null,
            kappungsgrenze: formData.kappungsgrenze.geprueft ? formData.kappungsgrenze : null,
            maengel: formData.modernisierungsmangel.vorhanden ? formData.modernisierungsmangel : null,
            formale_fehler: formData.formale_fehler.vorhanden ? formData.formale_fehler : null,
          },
          analyse: widerspruchsanalyse,
          widerspruchsfrist: formData.widerspruchsfrist_tage,
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Widerspruch erfolgreich erstellt');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen des Widerspruchs');
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
        email_template: 'mieterhoehung_widerspruch',
        context: {
          gruende: formData.einspruchsgruende.length,
          frist: formData.widerspruchsfrist_tage
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

  const getErfolgsaussichtenBadge = () => {
    if (!widerspruchsanalyse) return null;
    const color = 
      widerspruchsanalyse.erfolgsaussichten === 'hoch' ? 'bg-green-100 text-green-700' :
      widerspruchsanalyse.erfolgsaussichten === 'mittel' ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700';
    
    const text = 
      widerspruchsanalyse.erfolgsaussichten === 'hoch' ? 'Hohe Erfolgsaussichten' :
      widerspruchsanalyse.erfolgsaussichten === 'mittel' ? 'Mittlere Erfolgsaussichten' :
      'Niedrige Erfolgsaussichten';

    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>{text}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚖️ Widerspruch gegen Mieterhöhung
          </h1>
          <p className="text-gray-600">
            Lege rechtssicheren Widerspruch gegen eine Mieterhöhung ein
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

              <div>
                <Label>Mietbeginn</Label>
                <Input
                  type="date"
                  value={formData.mietbeginn}
                  onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Tipp:</strong> Der Widerspruch sollte innerhalb von 30 Tagen nach Zugang der Erhöhung eingereicht werden.
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Mieterhöhung Details */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Mieterhöhung Details">
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Geben Sie die Details der Mieterhöhung ein, die Sie erhalten haben
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Aktuelle Miete (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.aktuelle_miete}
                    onChange={(e) => updateFormData('aktuelle_miete', e.target.value)}
                    placeholder="750.00"
                  />
                </div>
                <div>
                  <Label>Neue Miete (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.neue_miete}
                    onChange={(e) => updateFormData('neue_miete', e.target.value)}
                    placeholder="900.00"
                  />
                </div>
                <div>
                  <Label>Erhöhungsbetrag (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.erhoehungsbetrag}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Kündigungsdatum *</Label>
                  <Input
                    type="date"
                    value={formData.kuendigungsdatum}
                    onChange={(e) => updateFormData('kuendigungsdatum', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Wirksam ab</Label>
                  <Input
                    type="date"
                    value={formData.wirksam_ab}
                    onChange={(e) => updateFormData('wirksam_ab', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Kündigungsfrist eingehalten? *</Label>
                  <Select
                    value={formData.kuendigungsfrist_eingehalten}
                    onValueChange={(val) => updateFormData('kuendigungsfrist_eingehalten', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">Ja</SelectItem>
                      <SelectItem value="nein">Nein - zu kurze Frist!</SelectItem>
                      <SelectItem value="unklar">Unklar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.kuendigungsfrist_eingehalten === 'nein' && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <p className="text-sm text-red-800 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Wichtig:</strong> Wenn die Kündigungsfrist nicht eingehalten wurde, ist die Erhöhung unwirksam! 
                      Das ist ein sehr starkes Argument.
                    </span>
                  </p>
                </div>
              )}

              {formData.aktuelle_miete && formData.neue_miete && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
                  <div className="text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700">Erhöhungsbetrag:</span>
                      <span className="font-semibold">{(parseFloat(formData.neue_miete) - parseFloat(formData.aktuelle_miete)).toFixed(2)} €/Monat</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Erhöhungsquote:</span>
                      <span className="font-semibold">{(((parseFloat(formData.neue_miete) - parseFloat(formData.aktuelle_miete)) / parseFloat(formData.aktuelle_miete)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Gründe */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Widerspruchsgründe">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Wählen Sie alle zutreffenden Gründe. Mehrere Argumente machen den Widerspruch stärker.
                </p>
              </div>

              <div className="space-y-3">
                {einspruchsgruendeOptions.map(option => (
                  <label key={option.value} className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    formData.einspruchsgruende.includes(option.value) 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200'
                  }`}>
                    <Checkbox
                      checked={formData.einspruchsgruende.includes(option.value)}
                      onCheckedChange={() => toggleGrund(option.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <p className="text-sm text-gray-600 mt-1">{option.beschreibung}</p>
                    </div>
                  </label>
                ))}
              </div>

              {formData.einspruchsgruende.includes('mietspiegel') && (
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-5 space-y-4">
                  <h4 className="font-semibold text-indigo-900">Mietspiegel-Vergleich</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Vergleichsmiete (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.mietspiegel_vergleich.vergleichsmiete}
                        onChange={(e) => updateNested('mietspiegel_vergleich', 'vergleichsmiete', e.target.value)}
                        placeholder="Marktübliche Miete"
                      />
                    </div>
                    <div>
                      <Label>Vergleichsort / Quelle</Label>
                      <Input
                        value={formData.mietspiegel_vergleich.vergleichsort}
                        onChange={(e) => updateNested('mietspiegel_vergleich', 'vergleichsort', e.target.value)}
                        placeholder="Örtlicher Mietspiegel, Immoscout24, etc."
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.einspruchsgruende.includes('kappungsgrenze') && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5 space-y-4">
                  <h4 className="font-semibold text-yellow-900">Kappungsgrenze (§ 558 BGB)</h4>
                  <p className="text-sm text-yellow-800">
                    Innerhalb von 3 Jahren max. 20% Steigerung. Pro Jahr: max. 3€/m² Steigerung.
                  </p>
                  <div>
                    <Label>Erlaubter Prozentsatz dieser Erhöhung: (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.kappungsgrenze.prozentsatz}
                      onChange={(e) => updateNested('kappungsgrenze', 'prozentsatz', e.target.value)}
                      placeholder="20"
                    />
                  </div>
                </div>
              )}

              {formData.einspruchsgruende.includes('maengel') && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5 space-y-4">
                  <h4 className="font-semibold text-red-900">Mängel der Wohnung</h4>
                  <Textarea
                    value={formData.modernisierungsmangel.maengel_beschreibung}
                    onChange={(e) => updateNested('modernisierungsmangel', 'maengel_beschreibung', e.target.value)}
                    rows={4}
                    placeholder="Beschreibe die Mängel, die den Wert der Wohnung reduzieren..."
                  />
                </div>
              )}

              {formData.einspruchsgruende.includes('formale_fehler') && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-5 space-y-4">
                  <h4 className="font-semibold text-orange-900">Formale Fehler</h4>
                  <Textarea
                    value={formData.formale_fehler.fehler_beschreibung}
                    onChange={(e) => updateNested('formale_fehler', 'fehler_beschreibung', e.target.value)}
                    rows={4}
                    placeholder="Welche formalen Fehler wurden gemacht? (z.B. falsche Frist, fehlende Begründung, etc.)"
                  />
                </div>
              )}

              {formData.einspruchsgruende.length > 0 && !widerspruchsanalyse && (
                <Button
                  onClick={analysiereWiderspruch}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analysiere Widerspruch...
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4 mr-2" />
                      Erfolgsaussichten analysieren
                    </>
                  )}
                </Button>
              )}

              {widerspruchsanalyse && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-purple-900">Analyseergebnis</h4>
                    {getErfolgsaussichtenBadge()}
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Stärke Ihres Widerspruchs:</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          widerspruchsanalyse.punkte > 60 ? 'bg-green-500' :
                          widerspruchsanalyse.punkte > 30 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: Math.min(widerspruchsanalyse.punkte, 100) + '%' }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{widerspruchsanalyse.punkte} Punkte</div>
                  </div>

                  {widerspruchsanalyse.gruende.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Stärkste Argumente:</p>
                      <div className="space-y-2">
                        {widerspruchsanalyse.gruende.map((grund, idx) => (
                          <div key={idx} className={`p-2 rounded text-sm ${
                            grund.typ === 'kritisch' ? 'bg-red-100 text-red-800' :
                            grund.typ === 'stark' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {grund.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {widerspruchsanalyse.risiken.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Mögliche Risiken:</p>
                      <div className="space-y-1">
                        {widerspruchsanalyse.risiken.map((risiko, idx) => (
                          <div key={idx} className="text-sm text-orange-800 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {risiko}
                          </div>
                        ))}
                      </div>
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
            <FormSection title="Schritt 4 von 4: Widerspruch erstellen">
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
                          Erstelle Widerspruch...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 mr-2" />
                          Widerspruch erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Widerspruch erfolgreich erstellt!
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
                          <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Wichtig:</strong> Der Widerspruch muss dem Vermieter nachweisbar zugestellt werden 
                            (Einschreiben mit Rückschein, persönlich mit Bestätigung oder beglaubigte Kopie).
                          </span>
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Frist:</strong> Stelle sicher, dass Du den Widerspruch innerhalb von 30 Tagen 
                            nach Zugang der Kündigungsmitteilung einreichst.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Mieterhöhungen zentral verwalten"
              benefit="Mit Vermietify verfolgst du alle Mieterhöhungen, ihre Rechtzeitigkeit und Erfolgsaussichten zentral."
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