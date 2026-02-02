import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, FileText, Calendar, Download, Mail, Save, Info, XCircle } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Kuendigung() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Art der Kündigung
    kuendiger: 'vermieter', // vermieter, mieter
    kuendigungsart: 'ordentlich', // ordentlich, fristlos
    
    // Schritt 2: Mietverhältnis
    mieter_name: '',
    mieter_adresse: '',
    wohnung: '',
    mietbeginn: '',
    aktuelle_miete: '',
    
    // Schritt 3: Kündigungsgrund
    kuendigungsgrund: '', // vermieter: eigenbedarf, verwertung, pflichtverletzung, mieter: keine Angabe nötig
    grund_details: '',
    
    // Vermieter-spezifisch
    eigenbedarf_person: '', // verwandt, selbst
    eigenbedarf_name: '',
    eigenbedarf_grund: '',
    pflichtverletzung_details: '',
    abmahnung_erteilt: false,
    abmahnung_datum: '',
    
    // Mieter-spezifisch bei fristlos
    fristlos_grund_mieter: '', // mängel, gesundheit, etc.
    
    // Schritt 4: Kündigungsdatum
    kuendigungsdatum_wunsch: '',
  });

  const [fristenData, setFristenData] = useState(null);
  const [rechtlichePruefung, setRechtlichePruefung] = useState(null);

  const steps = [
    'Kündigungsart',
    'Mietverhältnis',
    'Kündigungsgrund',
    'Fristen',
    'Dokument'
  ];

  const kuendigungsgruende = {
    vermieter: {
      ordentlich: [
        { value: 'eigenbedarf', label: 'Eigenbedarf (§ 573 Abs. 2 Nr. 2 BGB)' },
        { value: 'verwertung', label: 'Wirtschaftliche Verwertung (§ 573 Abs. 2 Nr. 3 BGB)' },
        { value: 'pflichtverletzung', label: 'Pflichtverletzung des Mieters (§ 573 Abs. 2 Nr. 1 BGB)' }
      ],
      fristlos: [
        { value: 'zahlungsverzug', label: 'Zahlungsverzug (mind. 2 Monatsmieten)' },
        { value: 'mieterschaden', label: 'Erhebliche Beschädigung der Mietsache' },
        { value: 'unerlaubte_untervermietung', label: 'Unerlaubte Untervermietung' },
        { value: 'stoerung', label: 'Erhebliche Störung des Hausfriedens' }
      ]
    },
    mieter: {
      fristlos: [
        { value: 'maengel', label: 'Erhebliche Mängel der Wohnung' },
        { value: 'gesundheit', label: 'Gesundheitsgefährdung' },
        { value: 'vermieterverstoesse', label: 'Schwerwiegende Pflichtverletzung Vermieter' }
      ]
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
        template_id: 'kuendigung',
        document_name: `Kündigung ${formData.mieter_name || 'Entwurf'}`,
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

  const calculateFristen = async () => {
    setLoading(true);
    try {
      const frist_typ = formData.kuendiger === 'vermieter' ? 'kuendigung_vermieter' : 'kuendigung_mieter';
      
      const result = await base44.functions.invoke('calculateFristen', {
        frist_typ: frist_typ,
        mietverhaeltnis_seit: formData.mietbeginn,
        stichtag: new Date().toISOString(),
        kuendigungsgrund: formData.kuendigungsgrund
      });

      if (result.data) {
        setFristenData(result.data);
        toast.success('Kündigungsfristen berechnet');
      }
    } catch (err) {
      console.error('Fristen error:', err);
      toast.error('Fehler bei der Fristenberechnung');
    } finally {
      setLoading(false);
    }
  };

  const pruefenRechtlicheVoraussetzungen = () => {
    const pruefungen = [];
    let istZulaessig = true;

    if (formData.kuendiger === 'vermieter' && formData.kuendigungsart === 'ordentlich') {
      if (formData.kuendigungsgrund === 'eigenbedarf') {
        if (!formData.eigenbedarf_person || !formData.eigenbedarf_grund) {
          pruefungen.push({
            typ: 'fehler',
            text: 'Für Eigenbedarf müssen Person und Grund konkret benannt werden.'
          });
          istZulaessig = false;
        } else {
          pruefungen.push({
            typ: 'erfolg',
            text: 'Eigenbedarfsgrund vollständig angegeben.'
          });
        }
      }

      if (formData.kuendigungsgrund === 'pflichtverletzung') {
        if (!formData.abmahnung_erteilt) {
          pruefungen.push({
            typ: 'warnung',
            text: 'In der Regel ist vor Kündigung wegen Pflichtverletzung eine Abmahnung erforderlich.'
          });
        } else {
          pruefungen.push({
            typ: 'erfolg',
            text: 'Abmahnung wurde erteilt.'
          });
        }
      }
    }

    if (formData.kuendiger === 'vermieter' && formData.kuendigungsart === 'fristlos') {
      if (formData.kuendigungsgrund === 'zahlungsverzug') {
        const miete = parseFloat(formData.aktuelle_miete) || 0;
        pruefungen.push({
          typ: 'info',
          text: `Fristlose Kündigung wegen Zahlungsverzug erfordert Rückstand von mindestens ${(miete * 2).toFixed(2)} € (2 Monatsmieten).`
        });
      }

      pruefungen.push({
        typ: 'warnung',
        text: 'Fristlose Kündigung muss mit ordentlicher Kündigung kombiniert werden (hilfsweise).'
      });
    }

    if (formData.kuendiger === 'mieter' && formData.kuendigungsart === 'fristlos') {
      pruefungen.push({
        typ: 'warnung',
        text: 'Fristlose Kündigung durch Mieter ist nur in Ausnahmefällen zulässig. Lass dich rechtlich beraten.'
      });
    }

    setRechtlichePruefung({
      istZulaessig,
      pruefungen
    });
  };

  const nextStep = () => {
    if (currentStep === 2) {
      if (!formData.mieter_name || !formData.wohnung || !formData.mietbeginn) {
        toast.error('Bitte alle Pflichtfelder ausfüllen');
        return;
      }
    }

    if (currentStep === 3) {
      if (formData.kuendiger === 'vermieter' && !formData.kuendigungsgrund) {
        toast.error('Bitte Kündigungsgrund auswählen');
        return;
      }
      pruefenRechtlicheVoraussetzungen();
    }

    if (currentStep === 4) {
      if (!fristenData) {
        calculateFristen();
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generateDocument = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'kuendigung',
        data: {
          vermieter: {
            name: user?.full_name || 'Max Mustermann',
          },
          mieter: {
            name: formData.mieter_name,
            adresse: formData.mieter_adresse,
            wohnung: formData.wohnung,
          },
          kuendigung: {
            kuendiger: formData.kuendiger,
            art: formData.kuendigungsart,
            grund: formData.kuendigungsgrund,
            grund_details: formData.grund_details,
          },
          eigenbedarf: formData.kuendigungsgrund === 'eigenbedarf' ? {
            person: formData.eigenbedarf_person,
            name: formData.eigenbedarf_name,
            grund: formData.eigenbedarf_grund
          } : null,
          pflichtverletzung: formData.kuendigungsgrund === 'pflichtverletzung' ? {
            details: formData.pflichtverletzung_details,
            abmahnung_erteilt: formData.abmahnung_erteilt,
            abmahnung_datum: formData.abmahnung_datum
          } : null,
          fristen: fristenData,
          mietverhaeltnis: {
            beginn: formData.mietbeginn,
            miete: formData.aktuelle_miete
          },
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Kündigung erfolgreich erstellt');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen der Kündigung');
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
        email_template: 'kuendigung',
        context: {
          art: formData.kuendigungsart,
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

  const verfuegbareGruende = formData.kuendigungsart === 'ordentlich' 
    ? kuendigungsgruende[formData.kuendiger]?.ordentlich || []
    : kuendigungsgruende[formData.kuendiger]?.fristlos || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Kündigung erstellen
          </h1>
          <p className="text-gray-600">
            Erstelle eine rechtssichere Kündigung mit automatischer Fristenberechnung
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={5} steps={steps} />

        {/* Schritt 1: Kündigungsart */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 5: Art der Kündigung">
            <div className="space-y-6">
              <div>
                <Label className="text-lg mb-3 block">Wer kündigt?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`p-5 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    formData.kuendiger === 'vermieter' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="kuendiger"
                      value="vermieter"
                      checked={formData.kuendiger === 'vermieter'}
                      onChange={(e) => updateFormData('kuendiger', e.target.value)}
                      className="mr-3"
                    />
                    <span className="font-semibold text-lg">Vermieter kündigt</span>
                  </label>

                  <label className={`p-5 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    formData.kuendiger === 'mieter' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="kuendiger"
                      value="mieter"
                      checked={formData.kuendiger === 'mieter'}
                      onChange={(e) => updateFormData('kuendiger', e.target.value)}
                      className="mr-3"
                    />
                    <span className="font-semibold text-lg">Mieter kündigt</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-lg mb-3 block">Kündigungsart</Label>
                <div className="space-y-3">
                  <label className={`flex items-start gap-4 p-5 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    formData.kuendigungsart === 'ordentlich' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="kuendigungsart"
                      value="ordentlich"
                      checked={formData.kuendigungsart === 'ordentlich'}
                      onChange={(e) => updateFormData('kuendigungsart', e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-1">Ordentliche Kündigung</div>
                      <div className="text-sm text-gray-600">
                        Unter Einhaltung der gesetzlichen Kündigungsfristen
                        {formData.kuendiger === 'vermieter' && ' (erfordert berechtigtes Interesse)'}
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 p-5 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    formData.kuendigungsart === 'fristlos' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="kuendigungsart"
                      value="fristlos"
                      checked={formData.kuendigungsart === 'fristlos'}
                      onChange={(e) => updateFormData('kuendigungsart', e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-1 flex items-center gap-2">
                        Fristlose Kündigung
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Außerordentlich</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Bei wichtigem Grund, ohne Einhaltung der Kündigungsfrist (§ 543 BGB)
                      </div>
                      <div className="mt-2 bg-red-100 border border-red-300 rounded p-3 text-xs text-red-800 flex gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Hohe rechtliche Anforderungen - im Zweifel Rechtsberatung einholen!</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Mietverhältnis */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 5: Mietverhältnis">
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
                  <Label>Mietbeginn *</Label>
                  <Input
                    type="date"
                    value={formData.mietbeginn}
                    onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Anschrift des Mieters</Label>
                <Input
                  value={formData.mieter_adresse}
                  onChange={(e) => updateFormData('mieter_adresse', e.target.value)}
                  placeholder="Musterstraße 10, 3. OG links"
                />
              </div>

              <div>
                <Label>Mietobjekt *</Label>
                <Input
                  value={formData.wohnung}
                  onChange={(e) => updateFormData('wohnung', e.target.value)}
                  placeholder="Musterstraße 10, 10115 Berlin"
                />
              </div>

              <div>
                <Label>Aktuelle Kaltmiete (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.aktuelle_miete}
                  onChange={(e) => updateFormData('aktuelle_miete', e.target.value)}
                  placeholder="750.00"
                />
              </div>

              {formData.mietbeginn && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm">
                    <strong>Mietdauer:</strong>{' '}
                    {(() => {
                      const beginn = new Date(formData.mietbeginn);
                      const heute = new Date();
                      const jahre = Math.floor((heute - beginn) / (1000 * 60 * 60 * 24 * 365.25));
                      const monate = Math.floor(((heute - beginn) / (1000 * 60 * 60 * 24 * 30.44)) % 12);
                      return `${jahre} Jahr${jahre !== 1 ? 'e' : ''}, ${monate} Monat${monate !== 1 ? 'e' : ''}`;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Kündigungsgrund */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 5: Kündigungsgrund">
            <div className="space-y-6">
              {formData.kuendiger === 'vermieter' ? (
                <>
                  <div>
                    <Label>Kündigungsgrund *</Label>
                    <Select
                      value={formData.kuendigungsgrund}
                      onValueChange={(val) => updateFormData('kuendigungsgrund', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Grund auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {verfuegbareGruende.map(grund => (
                          <SelectItem key={grund.value} value={grund.value}>
                            {grund.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.kuendigungsgrund === 'eigenbedarf' && (
                    <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-5 space-y-4">
                      <h4 className="font-semibold text-indigo-900">Angaben zum Eigenbedarf</h4>
                      
                      <div>
                        <Label>Für wen wird die Wohnung benötigt? *</Label>
                        <Select
                          value={formData.eigenbedarf_person}
                          onValueChange={(val) => updateFormData('eigenbedarf_person', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Person auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="selbst">Für mich selbst</SelectItem>
                            <SelectItem value="ehegatte">Ehegatte / Partner</SelectItem>
                            <SelectItem value="kind">Kind</SelectItem>
                            <SelectItem value="eltern">Eltern</SelectItem>
                            <SelectItem value="familie_sonstig">Sonstige Familienangehörige</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Name der einziehenden Person *</Label>
                        <Input
                          value={formData.eigenbedarf_name}
                          onChange={(e) => updateFormData('eigenbedarf_name', e.target.value)}
                          placeholder="Max Mustermann"
                        />
                      </div>

                      <div>
                        <Label>Begründung des Eigenbedarfs *</Label>
                        <Textarea
                          value={formData.eigenbedarf_grund}
                          onChange={(e) => updateFormData('eigenbedarf_grund', e.target.value)}
                          rows={4}
                          placeholder="Konkrete Darlegung, warum die Wohnung benötigt wird (z.B. berufliche Gründe, räumliche Enge der aktuellen Wohnung, etc.)"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Die Begründung muss nachvollziehbar und konkret sein. Allgemeine Angaben reichen nicht aus.
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.kuendigungsgrund === 'pflichtverletzung' && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5 space-y-4">
                      <h4 className="font-semibold text-yellow-900">Angaben zur Pflichtverletzung</h4>
                      
                      <div>
                        <Label>Beschreibung der Pflichtverletzung *</Label>
                        <Textarea
                          value={formData.pflichtverletzung_details}
                          onChange={(e) => updateFormData('pflichtverletzung_details', e.target.value)}
                          rows={4}
                          placeholder="Detaillierte Beschreibung der Pflichtverletzung..."
                        />
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="abmahnung"
                          checked={formData.abmahnung_erteilt}
                          onCheckedChange={(checked) => updateFormData('abmahnung_erteilt', checked)}
                        />
                        <div className="flex-1">
                          <Label htmlFor="abmahnung" className="cursor-pointer">
                            Abmahnung wurde bereits erteilt
                          </Label>
                          {formData.abmahnung_erteilt && (
                            <Input
                              type="date"
                              value={formData.abmahnung_datum}
                              onChange={(e) => updateFormData('abmahnung_datum', e.target.value)}
                              className="mt-2"
                              placeholder="Datum der Abmahnung"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.kuendigungsgrund === 'zahlungsverzug' && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
                      <h4 className="font-semibold text-red-900 mb-3">Zahlungsverzug</h4>
                      <div className="text-sm text-red-800 space-y-2">
                        <p>
                          <strong>Voraussetzungen für fristlose Kündigung:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Rückstand von mindestens 2 Monatsmieten (Bruttomiete inkl. Nebenkosten)</li>
                          <li>Oder: An 2 aufeinanderfolgenden Terminen mit mehr als 1 Monatsmiete im Rückstand</li>
                        </ul>
                        {formData.aktuelle_miete && (
                          <div className="bg-white rounded p-3 mt-3">
                            <div className="font-semibold">
                              Erforderlicher Rückstand: mind. {(parseFloat(formData.aktuelle_miete) * 2).toFixed(2)} €
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Zusätzliche Details / Begründung</Label>
                    <Textarea
                      value={formData.grund_details}
                      onChange={(e) => updateFormData('grund_details', e.target.value)}
                      rows={4}
                      placeholder="Weitere Details zur Begründung der Kündigung..."
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <p className="text-sm text-green-800">
                      <Info className="w-4 h-4 inline mr-2" />
                      Als Mieter benötigst du bei ordentlicher Kündigung keinen Kündigungsgrund anzugeben.
                    </p>
                  </div>

                  {formData.kuendigungsart === 'fristlos' && (
                    <>
                      <div>
                        <Label>Grund für fristlose Kündigung *</Label>
                        <Select
                          value={formData.fristlos_grund_mieter}
                          onValueChange={(val) => updateFormData('fristlos_grund_mieter', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Grund auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {verfuegbareGruende.map(grund => (
                              <SelectItem key={grund.value} value={grund.value}>
                                {grund.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Detaillierte Begründung *</Label>
                        <Textarea
                          value={formData.grund_details}
                          onChange={(e) => updateFormData('grund_details', e.target.value)}
                          rows={5}
                          placeholder="Detaillierte Beschreibung der Gründe für die fristlose Kündigung..."
                        />
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Wichtig:</strong> Eine fristlose Kündigung durch den Mieter ist nur bei schwerwiegenden 
                            Gründen zulässig. Lasse dich vorab rechtlich beraten!
                          </span>
                        </p>
                      </div>
                    </>
                  )}

                  {formData.kuendigungsart === 'ordentlich' && (
                    <div>
                      <Label>Optional: Kündigungsgrund</Label>
                      <Textarea
                        value={formData.grund_details}
                        onChange={(e) => updateFormData('grund_details', e.target.value)}
                        rows={3}
                        placeholder="Du kannst optional einen Grund angeben (z.B. berufliche Veränderung, Umzug...)"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Fristen */}
        {currentStep === 4 && (
          <FormSection title="Schritt 4 von 5: Kündigungsfristen">
            <div className="space-y-6">
              {rechtlichePruefung && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold">Rechtliche Prüfung</h4>
                  {rechtlichePruefung.pruefungen.map((pruefung, idx) => (
                    <div
                      key={idx}
                      className={`rounded p-4 flex gap-3 ${
                        pruefung.typ === 'erfolg' ? 'bg-green-50 border border-green-200' :
                        pruefung.typ === 'warnung' ? 'bg-yellow-50 border border-yellow-200' :
                        pruefung.typ === 'fehler' ? 'bg-red-50 border border-red-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      {pruefung.typ === 'erfolg' && <span className="text-green-600 text-xl">✓</span>}
                      {pruefung.typ === 'warnung' && <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                      {pruefung.typ === 'fehler' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                      {pruefung.typ === 'info' && <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                      <span className="text-sm">{pruefung.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {!fristenData ? (
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
                      <>
                        <Calendar className="w-5 h-5 mr-2" />
                        Kündigungsfristen berechnen
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-6 h-6" />
                      Kündigungsfristen
                    </h3>
                    
                    <div className="space-y-4">
                      {formData.kuendigungsart === 'ordentlich' ? (
                        <>
                          <div className="bg-white rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Kündigungsfrist:</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {fristenData.kuendigungsfrist || '3 Monate'} zum Monatsende
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Frühester Kündigungszeitpunkt:</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {fristenData.fruehester_termin ? new Date(fristenData.fruehester_termin).toLocaleDateString('de-DE') : 'Wird berechnet'}
                            </div>
                          </div>

                          <div className="bg-indigo-100 rounded-lg p-4">
                            <div className="text-sm text-indigo-700 mb-1">Kündigung wirksam zum:</div>
                            <div className="text-xl font-bold text-indigo-900">
                              {fristenData.wirksam_ab ? new Date(fristenData.wirksam_ab).toLocaleDateString('de-DE') : 'Wird berechnet'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-red-100 rounded-lg p-4">
                          <div className="text-sm text-red-700 mb-1">Fristlose Kündigung:</div>
                          <div className="text-xl font-bold text-red-900">
                            Sofortige Wirkung
                          </div>
                          <div className="text-xs text-red-600 mt-2">
                            Die Kündigung wird mit Zugang wirksam. Zusätzlich sollte hilfsweise eine ordentliche Kündigung ausgesprochen werden.
                          </div>
                        </div>
                      )}
                    </div>

                    {fristenData.hinweis && (
                      <div className="mt-4 bg-blue-100 border border-blue-300 rounded p-3">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {fristenData.hinweis}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 5: Dokument */}
        {currentStep === 5 && (
          <div>
            <FormSection title="Schritt 5 von 5: Kündigung erstellen">
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
                          Erstelle Kündigung...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 mr-2" />
                          Kündigung erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Kündigung erfolgreich erstellt!
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
                      <div className="bg-red-50 border border-red-200 rounded p-4">
                        <p className="text-sm text-red-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>WICHTIG:</strong> Die Kündigung muss dem Empfänger nachweisbar zugehen 
                            (Einschreiben mit Rückschein oder persönliche Übergabe gegen Empfangsbestätigung).
                          </span>
                        </p>
                      </div>

                      {formData.kuendigungsart === 'fristlos' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                          <p className="text-sm text-yellow-800 flex items-start gap-2">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>Hinweis:</strong> Zusätzlich zur fristlosen sollte eine hilfsweise ordentliche 
                              Kündigung ausgesprochen werden, falls die fristlose Kündigung unwirksam sein sollte.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Kündigungen rechtssicher verwalten"
              benefit="Mit Vermietify werden Kündigungen automatisch mit korrekten Fristen versehen und der gesamte Prozess dokumentiert."
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
            disabled={loading || (currentStep === 5 && !generatedDoc)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentStep === 5 ? (
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