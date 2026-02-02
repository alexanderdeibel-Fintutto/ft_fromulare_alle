import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Download, Mail, Save, Plus, Trash2, Info, Calendar, CheckCircle2 } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Abmahnung() {
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
    
    // Schritt 2: Abmahnungsgrund
    abmahnungstyp: 'mietruckstand', // mietruckstand, beschaedigungen, verhalten, nebenkosten, sonstiges
    hauptverstoss: '',
    
    // Verstöße/Vorwürfe
    verstaeusse: [
      {
        beschreibung: '',
        datum: '',
        beweise: '',
        erstmalig: true
      }
    ],
    
    // Schritt 3: Frist & Konsequenzen
    aenderungsfrist_tage: 14,
    aenderungsfrist_bis: '',
    konsequenz: 'kuendigung', // kuendigung, kautionspruefung, sonstiges
    konsequenz_text: 'Sollten Sie dieser Abmahnung nicht nachkommen, wird gekündigt.',
    
    // Rechtliche Prüfung
    abmahnungsvoraussetzungen: {
      verwarnung_frueherer_vertsoss: false,
      proportionalitaet_geprueft: false,
      frist_gesetzlich_korrekt: true
    }
  });

  const [abmahnungsanalyse, setAbmahnungsanalyse] = useState(null);

  const steps = [
    'Basisinfo',
    'Verstöße',
    'Frist & Konsequenzen',
    'Dokument'
  ];

  const abmahnungstypen = [
    { value: 'mietruckstand', label: 'Mietrückstand', default_text: 'Zahlungsverpflichtung verletzt' },
    { value: 'beschaedigungen', label: 'Beschädigungen', default_text: 'Sachbeschädigungen über Normalverschleiß' },
    { value: 'verhalten', label: 'Verhaltensverstöße', default_text: 'Hausordnungsverletzung' },
    { value: 'nebenkosten', label: 'Nebenkosten', default_text: 'Nebenkostenpflicht verletzt' },
    { value: 'unterhalt', label: 'Wartungs-/Instandhaltung', default_text: 'Instandhaltungspflicht verletzt' },
    { value: 'sonstiges', label: 'Sonstiges', default_text: 'Vertragsverletzung' }
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
        template_id: 'abmahnung',
        document_name: `Abmahnung ${formData.wohnung || 'Entwurf'}`,
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

  const updateAbmahnungsvoraussetzungen = (field, value) => {
    setFormData(prev => ({
      ...prev,
      abmahnungsvoraussetzungen: { ...prev.abmahnungsvoraussetzungen, [field]: value }
    }));
  };

  const addVerstoss = () => {
    setFormData(prev => ({
      ...prev,
      verstaeusse: [...prev.verstaeusse, {
        beschreibung: '',
        datum: '',
        beweise: '',
        erstmalig: true
      }]
    }));
  };

  const removeVerstoss = (index) => {
    setFormData(prev => ({
      ...prev,
      verstaeusse: prev.verstaeusse.filter((_, i) => i !== index)
    }));
  };

  const updateVerstoss = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      verstaeusse: prev.verstaeusse.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      )
    }));
  };

  const calculateAbmahnungsfrist = () => {
    const tage = parseInt(formData.aenderungsfrist_tage) || 14;
    const heute = new Date();
    const bis = new Date(heute.getTime() + tage * 24 * 60 * 60 * 1000);
    updateFormData('aenderungsfrist_bis', bis.toISOString().split('T')[0]);
  };

  const analysiereAbmahnung = () => {
    calculateAbmahnungsfrist();

    let analyse = {
      abmahnungstyp: formData.abmahnungstyp,
      anzahl_verstaeusse: formData.verstaeusse.filter(v => v.beschreibung).length,
      frist_tage: parseInt(formData.aenderungsfrist_tage),
      frist_bis: formData.aenderungsfrist_bis,
      probleme: [],
      empfehlungen: [],
      rechtlich_haltbar: true,
      bewaehrungschance: 100
    };

    // Prüfe Frist
    if (parseInt(formData.aenderungsfrist_tage) < 14) {
      analyse.probleme.push({
        typ: 'warnung',
        text: 'Frist unter 14 Tagen: Bei geringfügigen Verstößen oft unzureichend'
      });
      analyse.bewaehrungschance -= 15;
    }

    // Prüfe erste Abmahnung
    if (!formData.abmahnungsvoraussetzungen.verwarnung_frueherer_vertsoss && formData.konsequenz === 'kuendigung') {
      analyse.empfehlungen.push('Dies ist die erste Abmahnung - bei neuerlichen Verstößen kann gekündigt werden');
    }

    if (formData.abmahnungsvoraussetzungen.verwarnung_frueherer_vertsoss) {
      analyse.empfehlungen.push('Eine Abmahnung existiert bereits - Kündigung nach neuerlichem Verstoß rechtlich einfacher');
      analyse.bewaehrungschance += 20;
    }

    // Prüfe Proportionalität
    if (!formData.abmahnungsvoraussetzungen.proportionalitaet_geprueft) {
      analyse.probleme.push({
        typ: 'info',
        text: 'Proportionalität sollte geprüft sein: Ist die Abmahnung verhältnismäßig?'
      });
    }

    // Kapitel bei 100
    analyse.bewaehrungschance = Math.min(Math.max(analyse.bewaehrungschance, 0), 100);

    setAbmahnungsanalyse(analyse);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.mieter_name || !formData.vermieter_name || !formData.wohnung) {
        toast.error('Bitte Basisinformationen ausfüllen');
        return;
      }
    }

    if (currentStep === 2) {
      const hatVerstaeusse = formData.verstaeusse.some(v => v.beschreibung);
      if (!hatVerstaeusse) {
        toast.error('Bitte mindestens einen Verstoß eintragen');
        return;
      }
    }

    if (currentStep === 3) {
      analysiereAbmahnung();
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
        template_id: 'abmahnung',
        data: {
          mieter: {
            name: formData.mieter_name
          },
          vermieter: {
            name: formData.vermieter_name
          },
          wohnung: formData.wohnung,
          mietbeginn: formData.mietbeginn,
          abmahnungstyp: formData.abmahnungstyp,
          hauptverstoss: formData.hauptverstoss,
          verstaeusse: formData.verstaeusse.filter(v => v.beschreibung),
          aenderungsfrist: {
            tage: formData.aenderungsfrist_tage,
            bis: formData.aenderungsfrist_bis
          },
          konsequenz: formData.konsequenz,
          konsequenz_text: formData.konsequenz_text,
          analyse: abmahnungsanalyse,
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Abmahnung erfolgreich erstellt');
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
        email_template: 'abmahnung',
        context: {
          frist_bis: formData.aenderungsfrist_bis
        }
      });
      toast.success('Abmahnung versendet');
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
            ⚠️ Abmahnung erstellen
          </h1>
          <p className="text-gray-600">
            Verwarnen Sie Ihren Mieter rechtssicher vor Kündigung
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
                  placeholder="Musterstraße 10, 3. OG links"
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
                    <strong>Was ist eine Abmahnung?</strong> Eine Abmahnung ist eine schriftliche Verwarnung vor Kündigung. 
                    Sie dokumentiert einen Mietvertragsverstoss und ist oft erforderlich vor einer Kündigung.
                  </span>
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Verstöße */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Verstöße dokumentieren">
            <div className="space-y-6">
              <div>
                <Label>Art des Verstoßes *</Label>
                <Select
                  value={formData.abmahnungstyp}
                  onValueChange={(val) => {
                    updateFormData('abmahnungstyp', val);
                    const typ = abmahnungstypen.find(t => t.value === val);
                    updateFormData('hauptverstoss', typ?.default_text || '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {abmahnungstypen.map(typ => (
                      <SelectItem key={typ.value} value={typ.value}>
                        {typ.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Beschreibung des Verstoßes *</Label>
                <Textarea
                  value={formData.hauptverstoss}
                  onChange={(e) => updateFormData('hauptverstoss', e.target.value)}
                  rows={3}
                  placeholder="Detaillierte Beschreibung des Hauptverstoßes..."
                />
              </div>

              <div className="space-y-3 mt-6">
                <h4 className="font-semibold">Einzelne Verstöße / Vorfälle</h4>
                {formData.verstaeusse.map((verstoss, index) => (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="font-semibold">Verstoß {index + 1}</h5>
                      {formData.verstaeusse.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVerstoss(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Beschreibung *</Label>
                        <Textarea
                          value={verstoss.beschreibung}
                          onChange={(e) => updateVerstoss(index, 'beschreibung', e.target.value)}
                          rows={2}
                          placeholder="Was genau ist vorgefallen?"
                        />
                      </div>

                      <div>
                        <Label>Datum des Vorfalls</Label>
                        <Input
                          type="date"
                          value={verstoss.datum}
                          onChange={(e) => updateVerstoss(index, 'datum', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Beweise / Zeugen</Label>
                        <Input
                          value={verstoss.beweise}
                          onChange={(e) => updateVerstoss(index, 'beweise', e.target.value)}
                          placeholder="Fotos, Zeugen, Polizeibericht, etc."
                        />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          checked={verstoss.erstmalig}
                          onCheckedChange={(checked) => updateVerstoss(index, 'erstmalig', checked)}
                        />
                        <span className="text-sm">Erstmaliger Verstoß</span>
                      </label>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addVerstoss}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Weiteren Vorfall hinzufügen
                </Button>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Frist & Konsequenzen */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Frist & Konsequenzen">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Eine Abmahnung muss mindestens 14 Tage Frist zur Abhilfe geben.
                </p>
              </div>

              <div>
                <Label>Frist zur Abhilfe (Tage)</Label>
                <Input
                  type="number"
                  min="14"
                  value={formData.aenderungsfrist_tage}
                  onChange={(e) => updateFormData('aenderungsfrist_tage', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Mindestens 14 Tage empfohlen</p>
              </div>

              <Button
                onClick={calculateAbmahnungsfrist}
                variant="outline"
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Frist berechnen (bis {formData.aenderungsfrist_bis})
              </Button>

              <div>
                <Label>Konsequenz bei Nichtbeachtung</Label>
                <Select
                  value={formData.konsequenz}
                  onValueChange={(val) => updateFormData('konsequenz', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kuendigung">Kündigung des Mietvertrags</SelectItem>
                    <SelectItem value="kautionspruefung">Kautionsprüfung</SelectItem>
                    <SelectItem value="sonstiges">Sonstige Maßnahmen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Konsequenz-Text</Label>
                <Textarea
                  value={formData.konsequenz_text}
                  onChange={(e) => updateFormData('konsequenz_text', e.target.value)}
                  rows={3}
                  placeholder="Was passiert bei Nichtbeachtung?"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-yellow-900">Abmahnungsvoraussetzungen prüfen</h4>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={formData.abmahnungsvoraussetzungen.verwarnung_frueherer_vertsoss}
                    onCheckedChange={(checked) => updateAbmahnungsvoraussetzungen('verwarnung_frueherer_vertsoss', checked)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Es existiert bereits eine frühere Abmahnung</div>
                    <p className="text-xs text-gray-600 mt-1">Dies stärkt Ihre Position bei einer späteren Kündigung</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={formData.abmahnungsvoraussetzungen.proportionalitaet_geprueft}
                    onCheckedChange={(checked) => updateAbmahnungsvoraussetzungen('proportionalitaet_geprueft', checked)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Proportionalität ist gegeben</div>
                    <p className="text-xs text-gray-600 mt-1">Die Abmahnung steht in angemessenem Verhältnis zum Verstoß</p>
                  </div>
                </label>
              </div>

              {!abmahnungsanalyse && (
                <Button
                  onClick={analysiereAbmahnung}
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
                      Abmahnung analysieren
                    </>
                  )}
                </Button>
              )}

              {abmahnungsanalyse && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-purple-900">Rechtliche Analyse</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      abmahnungsanalyse.rechtlich_haltbar ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {abmahnungsanalyse.rechtlich_haltbar ? '✓ Haltbar' : '✗ Problematisch'}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Dokumentierte Verstöße:</span>
                      <span className="font-semibold">{abmahnungsanalyse.anzahl_verstaeusse}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Abhilfefrist:</span>
                      <span className="font-semibold">{abmahnungsanalyse.frist_tage} Tage (bis {abmahnungsanalyse.frist_bis})</span>
                    </div>
                  </div>

                  {abmahnungsanalyse.probleme.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-gray-700">Hinweise:</p>
                      {abmahnungsanalyse.probleme.map((prob, idx) => (
                        <div key={idx} className={`p-2 rounded text-sm flex items-start gap-2 ${
                          prob.typ === 'warnung' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {prob.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {abmahnungsanalyse.empfehlungen.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-gray-700">Empfehlungen:</p>
                      {abmahnungsanalyse.empfehlungen.map((emp, idx) => (
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
            <FormSection title="Schritt 4 von 4: Abmahnung erstellen">
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
                          Erstelle Abmahnung...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Abmahnung erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Abmahnung erstellt!
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
                            <strong>Wichtig:</strong> Senden Sie die Abmahnung per Einschreiben mit Rückschein 
                            oder per Email mit Lesebestätigung, um die Zustellung zu dokumentieren.
                          </span>
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Fristverlauf:</strong> Die Frist läuft ab dem {formData.aenderungsfrist_bis}. 
                            Dokumentieren Sie, ob der Mieter der Abmahnung nachkommt.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Mietrechtliche Prozesse vereinfachen"
              benefit="Mit Vermietify werden Abmahnungen, Kündigungen und Fristen zentral verwaltet und automatisch überwacht."
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