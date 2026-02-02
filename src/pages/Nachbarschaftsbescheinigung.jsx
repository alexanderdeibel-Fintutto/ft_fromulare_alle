import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, Save, Plus, Trash2, AlertCircle, FileText, Users } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Nachbarschaftsbescheinigung() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Wohnung & Mieter
    wohnung: '',
    mieter_name: '',
    auszugsdatum: '',
    wohnungsdauer_von: '',
    wohnungsdauer_bis: '',
    
    // Schritt 2: Nachbarn
    nachbarn: [
      {
        name: '',
        wohnung: '',
        kontakt: '',
        unterschrift_erklaert: false
      }
    ],
    
    // Schritt 3: Zustandsbewertung
    bewertungen: {
      allgemein_eindruck: 'gut', // gut, befriedigend, mangelhaft
      luft_bellueftung: 'einwandfrei', // einwandfrei, akzeptabel, problematisch
      geruechte: false,
      schimmel: false,
      feuchte: false,
      schaeden_waende: false,
      schaeden_boeden: false,
      schaeden_moebel: false,
      laerm_probleme: false,
      nachbarschaft_ruecksicht: 'ja', // ja, teilweise, nein
      
      // Detaillierte Beschreibung
      besonderheiten: '',
      verhalten_allgemein: 'ordnungsmaessig', // ordnungsmaessig, auffaellig, problematisch
    }
  });

  const steps = [
    'Wohnung & Mieter',
    'Nachbarn',
    'Bewertung',
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
        template_id: 'nachbarschaftsbescheinigung',
        document_name: `Nachbarschaftsbescheinigung ${formData.wohnung || 'Entwurf'}`,
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

  const updateBewertung = (field, value) => {
    setFormData(prev => ({
      ...prev,
      bewertungen: { ...prev.bewertungen, [field]: value }
    }));
  };

  const addNachbar = () => {
    setFormData(prev => ({
      ...prev,
      nachbarn: [...prev.nachbarn, {
        name: '',
        wohnung: '',
        kontakt: '',
        unterschrift_erklaert: false
      }]
    }));
  };

  const removeNachbar = (index) => {
    setFormData(prev => ({
      ...prev,
      nachbarn: prev.nachbarn.filter((_, i) => i !== index)
    }));
  };

  const updateNachbar = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      nachbarn: prev.nachbarn.map((n, i) =>
        i === index ? { ...n, [field]: value } : n
      )
    }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.wohnung || !formData.mieter_name || !formData.auszugsdatum) {
        toast.error('Bitte Wohnung, Mieter und Auszugsdatum ausfüllen');
        return;
      }
    }

    if (currentStep === 2) {
      const hatNachbarn = formData.nachbarn.some(n => n.name && n.wohnung);
      if (!hatNachbarn) {
        toast.error('Bitte mindestens einen Nachbarn eintragen');
        return;
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
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'nachbarschaftsbescheinigung',
        data: {
          wohnung: formData.wohnung,
          mieter: {
            name: formData.mieter_name,
            wohnung_von: formData.wohnungsdauer_von,
            wohnung_bis: formData.wohnungsdauer_bis,
            auszug: formData.auszugsdatum
          },
          nachbarn: formData.nachbarn.filter(n => n.name && n.wohnung),
          bewertungen: formData.bewertungen,
          statistik: {
            anzahl_nachbarn: formData.nachbarn.filter(n => n.name).length,
            negative_punkte: Object.values(formData.bewertungen).filter(v => 
              v === true || v === 'problematisch' || v === 'mangelhaft' || v === 'nein' || v === 'auffaellig'
            ).length
          },
          datum: new Date().toISOString().split('T')[0]
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Nachbarschaftsbescheinigung erstellt');
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
        email_template: 'nachbarschaftsbescheinigung',
        context: {
          anzahl_nachbarn: formData.nachbarn.filter(n => n.name).length
        }
      });
      toast.success('Email versendet');
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
            👥 Nachbarschaftsbescheinigung
          </h1>
          <p className="text-gray-600">
            Beweise den ordnungsgemäßen Zustand der Wohnung durch Nachbarn
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={steps} />

        {/* Schritt 1: Wohnung & Mieter */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 4: Wohnung & Mieter">
            <div className="space-y-4">
              <div>
                <Label>Wohnung / Objekt *</Label>
                <Input
                  value={formData.wohnung}
                  onChange={(e) => updateFormData('wohnung', e.target.value)}
                  placeholder="Musterstraße 10, 3. OG links, 10115 Berlin"
                />
              </div>

              <div>
                <Label>Mieter *</Label>
                <Input
                  value={formData.mieter_name}
                  onChange={(e) => updateFormData('mieter_name', e.target.value)}
                  placeholder="Anna Beispiel"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Mietbeginn</Label>
                  <Input
                    type="date"
                    value={formData.wohnungsdauer_von}
                    onChange={(e) => updateFormData('wohnungsdauer_von', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Mietende</Label>
                  <Input
                    type="date"
                    value={formData.wohnungsdauer_bis}
                    onChange={(e) => updateFormData('wohnungsdauer_bis', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Auszugsdatum *</Label>
                  <Input
                    type="date"
                    value={formData.auszugsdatum}
                    onChange={(e) => updateFormData('auszugsdatum', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Info:</strong> Eine Nachbarschaftsbescheinigung ist wertvoll bei Streitigkeiten 
                    über Schadensersatz und Kaution nach dem Auszug.
                  </span>
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Nachbarn */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Nachbarn">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tipp:</strong> Je mehr Nachbarn unterschreiben, desto glaubwürdiger die Bescheinigung. 
                  Fragen Sie mind. 2-3 Nachbarn.
                </p>
              </div>

              {formData.nachbarn.map((nachbar, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold">Nachbar {index + 1}</h4>
                    {formData.nachbarn.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNachbar(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={nachbar.name}
                        onChange={(e) => updateNachbar(index, 'name', e.target.value)}
                        placeholder="Max Mustermann"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Wohnung *</Label>
                        <Input
                          value={nachbar.wohnung}
                          onChange={(e) => updateNachbar(index, 'wohnung', e.target.value)}
                          placeholder="3. OG rechts"
                        />
                      </div>
                      <div>
                        <Label>Kontakt (Email/Telefon)</Label>
                        <Input
                          value={nachbar.kontakt}
                          onChange={(e) => updateNachbar(index, 'kontakt', e.target.value)}
                          placeholder="max@example.com"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer">
                      <Checkbox
                        checked={nachbar.unterschrift_erklaert}
                        onCheckedChange={(checked) => updateNachbar(index, 'unterschrift_erklaert', checked)}
                      />
                      <span className="text-sm text-gray-700">
                        Nachbar erklärt sich bereit zu unterschreiben
                      </span>
                    </label>
                  </div>
                </div>
              ))}

              <Button
                onClick={addNachbar}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Weiteren Nachbarn hinzufügen
              </Button>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Bewertung */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Zustandsbewertung">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Die Bewertung basiert auf den gesammelten Aussagen der Nachbarn. 
                  Sei ehrlich und objektiv.
                </p>
              </div>

              <div>
                <Label className="text-lg mb-3 block">Gesamteindruck der Wohnung</Label>
                <div className="space-y-2">
                  {['gut', 'befriedigend', 'mangelhaft'].map(val => (
                    <label key={val} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer border rounded-lg">
                      <input
                        type="radio"
                        name="eindruck"
                        value={val}
                        checked={formData.bewertungen.allgemein_eindruck === val}
                        onChange={(e) => updateBewertung('allgemein_eindruck', e.target.value)}
                      />
                      <span className="capitalize font-semibold">{val === 'gut' ? '✓ Gut gepflegt' : val === 'befriedigend' ? '~ Befriedigend' : '✗ Mangelhaft'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-lg mb-3 block">Lüftung & Belüftung</Label>
                <div className="space-y-2">
                  {['einwandfrei', 'akzeptabel', 'problematisch'].map(val => (
                    <label key={val} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer border rounded-lg">
                      <input
                        type="radio"
                        name="luft"
                        value={val}
                        checked={formData.bewertungen.luft_bellueftung === val}
                        onChange={(e) => updateBewertung('luft_bellueftung', e.target.value)}
                      />
                      <span className="capitalize">{val}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-3">Probleme beobachtet?</h4>
                <div className="space-y-2">
                  {[
                    { key: 'geruechte', label: 'Unangenehme Gerüche' },
                    { key: 'schimmel', label: 'Schimmel' },
                    { key: 'feuchte', label: 'Feuchtigkeit / Nässe' },
                    { key: 'schaeden_waende', label: 'Beschädigungen an Wänden' },
                    { key: 'schaeden_boeden', label: 'Beschädigungen am Boden' },
                    { key: 'schaeden_moebel', label: 'Beschädigungen an Mobiliar' },
                    { key: 'laerm_probleme', label: 'Lärm / Lärmbelästigung' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={formData.bewertungen[item.key]}
                        onCheckedChange={(checked) => updateBewertung(item.key, checked)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Verhalten des Mieters</Label>
                <div className="space-y-2 mt-2">
                  {['ordnungsmaessig', 'auffaellig', 'problematisch'].map(val => (
                    <label key={val} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer border rounded-lg">
                      <input
                        type="radio"
                        name="verhalten"
                        value={val}
                        checked={formData.bewertungen.verhalten_allgemein === val}
                        onChange={(e) => updateBewertung('verhalten_allgemein', e.target.value)}
                      />
                      <span className="capitalize">
                        {val === 'ordnungsmaessig' ? 'Ordnungsgemäß' : val === 'auffaellig' ? 'Auffällig' : 'Problematisch'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Nachbarschaftliches Verhalten des Mieters</Label>
                <div className="space-y-2 mt-2">
                  {['ja', 'teilweise', 'nein'].map(val => (
                    <label key={val} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer border rounded-lg">
                      <input
                        type="radio"
                        name="ruecksicht"
                        value={val}
                        checked={formData.bewertungen.nachbarschaft_ruecksicht === val}
                        onChange={(e) => updateBewertung('nachbarschaft_ruecksicht', e.target.value)}
                      />
                      <span className="capitalize">
                        {val === 'ja' ? 'Ja, rücksichtsvoll' : val === 'teilweise' ? 'Teilweise' : 'Nein'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Besonderheiten / Weitere Anmerkungen</Label>
                <Textarea
                  value={formData.bewertungen.besonderheiten}
                  onChange={(e) => updateBewertung('besonderheiten', e.target.value)}
                  rows={4}
                  placeholder="Sonstige Beobachtungen..."
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Dokument */}
        {currentStep === 4 && (
          <div>
            <FormSection title="Schritt 4 von 4: Bescheinigung erstellen">
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
                          Erstelle Bescheinigung...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 mr-2" />
                          Bescheinigung erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Bescheinigung erstellt!
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
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Nächste Schritte:</strong> Drucken Sie das Dokument aus und lassen Sie es von 
                          den Nachbarn unterzeichnen. Die Original-Unterschriften sind rechtlich wertvoll.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Auszugsprozess optimieren"
              benefit="Mit Vermietify werden Übergabeprotokolle, Nachbarschaftsbescheinigungen und Kautionsrückgabe zentral verwaltet."
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