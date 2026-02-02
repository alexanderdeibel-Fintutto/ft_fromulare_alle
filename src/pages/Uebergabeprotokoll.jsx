import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Home, Camera, Key, Gauge, ClipboardCheck, Download, Mail, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Uebergabeprotokoll() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    // Schritt 1: Basisinfo
    protokoll_typ: 'einzug', // einzug, auszug
    datum: new Date().toISOString().split('T')[0],
    mieter_name: '',
    wohnung: '',
    vermieter_name: '',
    
    // Schritt 2: Zählerstände
    zaehlerstaende: {
      strom: '',
      gas: '',
      wasser_kalt: '',
      wasser_warm: '',
      heizung: '',
    },
    
    // Schritt 3: Schlüssel
    schluessel: [
      { typ: 'Wohnungsschlüssel', anzahl: '', uebergeben: true },
      { typ: 'Haustürschlüssel', anzahl: '', uebergeben: true },
      { typ: 'Kellerschlüssel', anzahl: '', uebergeben: false },
      { typ: 'Briefkastenschlüssel', anzahl: '', uebergeben: false },
      { typ: 'Sonstige', anzahl: '', uebergeben: false },
    ],
    
    // Schritt 4: Räume & Zustand
    raeume: [
      { name: 'Flur', zustand: 'gut', maengel: '', fotos: [] },
      { name: 'Wohnzimmer', zustand: 'gut', maengel: '', fotos: [] },
      { name: 'Schlafzimmer', zustand: 'gut', maengel: '', fotos: [] },
      { name: 'Küche', zustand: 'gut', maengel: '', fotos: [] },
      { name: 'Bad', zustand: 'gut', maengel: '', fotos: [] },
    ],
    
    // Schritt 5: Sonstiges
    anmerkungen: '',
    vereinbarungen: '',
    renovierung_erforderlich: false,
    renovierung_details: '',
  });

  const steps = [
    'Basisinfo',
    'Zähler',
    'Schlüssel',
    'Räume',
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
        template_id: 'uebergabeprotokoll',
        document_name: `Übergabeprotokoll ${formData.mieter_name || 'Entwurf'}`,
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

  const updateZaehlerstand = (typ, value) => {
    setFormData(prev => ({
      ...prev,
      zaehlerstaende: { ...prev.zaehlerstaende, [typ]: value }
    }));
  };

  const updateSchluessel = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schluessel: prev.schluessel.map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      )
    }));
  };

  const addRaum = () => {
    setFormData(prev => ({
      ...prev,
      raeume: [...prev.raeume, { name: '', zustand: 'gut', maengel: '', fotos: [] }]
    }));
  };

  const removeRaum = (index) => {
    setFormData(prev => ({
      ...prev,
      raeume: prev.raeume.filter((_, i) => i !== index)
    }));
  };

  const updateRaum = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      raeume: prev.raeume.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  const uploadFoto = async (raumIndex, file) => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      
      if (result.file_url) {
        setFormData(prev => ({
          ...prev,
          raeume: prev.raeume.map((r, i) => 
            i === raumIndex ? { ...r, fotos: [...r.fotos, result.file_url] } : r
          )
        }));
        toast.success('Foto hochgeladen');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Fehler beim Upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeFoto = (raumIndex, fotoIndex) => {
    setFormData(prev => ({
      ...prev,
      raeume: prev.raeume.map((r, i) => 
        i === raumIndex ? { ...r, fotos: r.fotos.filter((_, fi) => fi !== fotoIndex) } : r
      )
    }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.mieter_name || !formData.wohnung) {
        toast.error('Bitte alle Pflichtfelder ausfüllen');
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
      const uebergebeneSchluessel = formData.schluessel.filter(s => s.uebergeben && parseInt(s.anzahl) > 0);
      const raeumeMitMaengeln = formData.raeume.filter(r => r.maengel && r.maengel.trim() !== '');

      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'uebergabeprotokoll',
        data: {
          typ: formData.protokoll_typ,
          datum: formData.datum,
          vermieter: {
            name: formData.vermieter_name,
          },
          mieter: {
            name: formData.mieter_name,
            wohnung: formData.wohnung,
          },
          zaehlerstaende: formData.zaehlerstaende,
          schluessel: uebergebeneSchluessel,
          raeume: formData.raeume,
          raeume_mit_maengeln: raeumeMitMaengeln,
          anmerkungen: formData.anmerkungen,
          vereinbarungen: formData.vereinbarungen,
          renovierung: {
            erforderlich: formData.renovierung_erforderlich,
            details: formData.renovierung_details
          },
          statistik: {
            gesamt_raeume: formData.raeume.length,
            raeume_gut: formData.raeume.filter(r => r.zustand === 'gut').length,
            raeume_befriedigend: formData.raeume.filter(r => r.zustand === 'befriedigend').length,
            raeume_mangelhaft: formData.raeume.filter(r => r.zustand === 'mangelhaft').length,
            gesamt_fotos: formData.raeume.reduce((sum, r) => sum + r.fotos.length, 0)
          }
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Übergabeprotokoll erfolgreich erstellt');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen des Protokolls');
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
        email_template: 'uebergabeprotokoll',
        context: {
          typ: formData.protokoll_typ === 'einzug' ? 'Einzug' : 'Auszug',
          datum: formData.datum
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

  const gesamtSchluessel = formData.schluessel
    .filter(s => s.uebergeben)
    .reduce((sum, s) => sum + (parseInt(s.anzahl) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏠 Übergabeprotokoll erstellen
          </h1>
          <p className="text-gray-600">
            Dokumentiere den Zustand der Wohnung bei Ein- oder Auszug
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={5} steps={steps} />

        {/* Schritt 1: Basisinfo */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 5: Basisinformationen">
            <div className="space-y-6">
              <div>
                <Label>Art des Protokolls *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    formData.protokoll_typ === 'einzug' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="protokoll_typ"
                      value="einzug"
                      checked={formData.protokoll_typ === 'einzug'}
                      onChange={(e) => updateFormData('protokoll_typ', e.target.value)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Einzugsprotokoll</div>
                      <div className="text-xs text-gray-600">Zustand bei Übergabe an Mieter</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    formData.protokoll_typ === 'auszug' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="protokoll_typ"
                      value="auszug"
                      checked={formData.protokoll_typ === 'auszug'}
                      onChange={(e) => updateFormData('protokoll_typ', e.target.value)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Auszugsprotokoll</div>
                      <div className="text-xs text-gray-600">Zustand bei Rückgabe durch Mieter</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={formData.datum}
                  onChange={(e) => updateFormData('datum', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Vermieter *</Label>
                  <Input
                    value={formData.vermieter_name}
                    onChange={(e) => updateFormData('vermieter_name', e.target.value)}
                    placeholder="Max Mustermann"
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
              </div>

              <div>
                <Label>Wohnung / Objekt *</Label>
                <Input
                  value={formData.wohnung}
                  onChange={(e) => updateFormData('wohnung', e.target.value)}
                  placeholder="Musterstraße 10, 3. OG links"
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Zählerstände */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 5: Zählerstände erfassen">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Erfasse alle relevanten Zählerstände zum Zeitpunkt der Übergabe
                </p>
              </div>

              {[
                { key: 'strom', label: 'Strom', einheit: 'kWh' },
                { key: 'gas', label: 'Gas', einheit: 'm³' },
                { key: 'wasser_kalt', label: 'Wasser Kalt', einheit: 'm³' },
                { key: 'wasser_warm', label: 'Wasser Warm', einheit: 'm³' },
                { key: 'heizung', label: 'Heizung', einheit: 'Einheiten' },
              ].map(({ key, label, einheit }) => (
                <div key={key} className="grid grid-cols-12 gap-3 items-center bg-white p-4 rounded-lg border">
                  <div className="col-span-4 font-medium text-gray-700">
                    {label}
                  </div>
                  <div className="col-span-6">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.zaehlerstaende[key]}
                      onChange={(e) => updateZaehlerstand(key, e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {einheit}
                  </div>
                </div>
              ))}

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Tipp: Mache Fotos der Zähler mit sichtbarem Zählerstand zur Dokumentation
                </p>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Schlüssel */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 5: Schlüsselübergabe">
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded p-3 mb-4">
                <p className="text-sm text-indigo-800 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Dokumentiere welche Schlüssel übergeben werden
                </p>
              </div>

              {formData.schluessel.map((schluessel, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center bg-white p-4 rounded-lg border">
                  <div className="col-span-1">
                    <Checkbox
                      checked={schluessel.uebergeben}
                      onCheckedChange={(checked) => updateSchluessel(index, 'uebergeben', checked)}
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      value={schluessel.typ}
                      onChange={(e) => updateSchluessel(index, 'typ', e.target.value)}
                      placeholder="Schlüsseltyp"
                      disabled={!schluessel.uebergeben}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={schluessel.anzahl}
                      onChange={(e) => updateSchluessel(index, 'anzahl', e.target.value)}
                      placeholder="Anzahl"
                      disabled={!schluessel.uebergeben}
                    />
                  </div>
                  <div className="col-span-3 text-sm text-gray-600">
                    Stück
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border-2 border-gray-300 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Gesamt übergebene Schlüssel:</span>
                  <span className="text-3xl font-bold text-indigo-600">{gesamtSchluessel}</span>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Räume & Zustand */}
        {currentStep === 4 && (
          <FormSection title="Schritt 4 von 5: Zustand der Räume">
            <div className="space-y-6">
              {formData.raeume.map((raum, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <Input
                      value={raum.name}
                      onChange={(e) => updateRaum(index, 'name', e.target.value)}
                      placeholder="Raumname"
                      className="text-lg font-semibold"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRaum(index)}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Zustand</Label>
                      <Select
                        value={raum.zustand}
                        onValueChange={(val) => updateRaum(index, 'zustand', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gut">
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-green-500"></span>
                              Gut
                            </span>
                          </SelectItem>
                          <SelectItem value="befriedigend">
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                              Befriedigend
                            </span>
                          </SelectItem>
                          <SelectItem value="mangelhaft">
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-red-500"></span>
                              Mangelhaft
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Mängel / Anmerkungen</Label>
                      <Textarea
                        value={raum.maengel}
                        onChange={(e) => updateRaum(index, 'maengel', e.target.value)}
                        rows={3}
                        placeholder="Beschreibe eventuelle Mängel oder Besonderheiten..."
                      />
                    </div>

                    <div>
                      <Label>Fotos</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {raum.fotos.map((foto, fotoIndex) => (
                          <div key={fotoIndex} className="relative group">
                            <img
                              src={foto}
                              alt={`Foto ${fotoIndex + 1}`}
                              className="w-24 h-24 object-cover rounded border"
                            />
                            <button
                              onClick={() => removeFoto(index, fotoIndex)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => uploadFoto(index, e.target.files[0])}
                            disabled={uploadingImage}
                          />
                          {uploadingImage ? (
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                          ) : (
                            <Camera className="w-6 h-6 text-gray-400" />
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                onClick={addRaum}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Weiteren Raum hinzufügen
              </Button>

              <div className="border-t pt-6">
                <div className="space-y-4">
                  {formData.protokoll_typ === 'auszug' && (
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="renovierung"
                        checked={formData.renovierung_erforderlich}
                        onCheckedChange={(checked) => updateFormData('renovierung_erforderlich', checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="renovierung" className="cursor-pointer">
                          Renovierung / Instandsetzung erforderlich
                        </Label>
                        {formData.renovierung_erforderlich && (
                          <Textarea
                            value={formData.renovierung_details}
                            onChange={(e) => updateFormData('renovierung_details', e.target.value)}
                            rows={3}
                            placeholder="Beschreibe welche Renovierungsarbeiten durchgeführt werden müssen..."
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Allgemeine Anmerkungen</Label>
                    <Textarea
                      value={formData.anmerkungen}
                      onChange={(e) => updateFormData('anmerkungen', e.target.value)}
                      rows={3}
                      placeholder="Weitere Anmerkungen zum Zustand der Wohnung..."
                    />
                  </div>

                  <div>
                    <Label>Vereinbarungen</Label>
                    <Textarea
                      value={formData.vereinbarungen}
                      onChange={(e) => updateFormData('vereinbarungen', e.target.value)}
                      rows={3}
                      placeholder="Getroffene Vereinbarungen zwischen Vermieter und Mieter..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 5: Dokument */}
        {currentStep === 5 && (
          <div>
            <FormSection title="Schritt 5 von 5: Protokoll erstellen">
              <div className="space-y-6">
                {!generatedDoc ? (
                  <>
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-300">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5" />
                        Zusammenfassung
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Protokoll-Typ:</span>
                          <div className="font-semibold">
                            {formData.protokoll_typ === 'einzug' ? 'Einzug' : 'Auszug'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Datum:</span>
                          <div className="font-semibold">
                            {new Date(formData.datum).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Mieter:</span>
                          <div className="font-semibold">{formData.mieter_name}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Wohnung:</span>
                          <div className="font-semibold">{formData.wohnung}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Erfasste Räume:</span>
                          <div className="font-semibold">{formData.raeume.length}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Übergebene Schlüssel:</span>
                          <div className="font-semibold">{gesamtSchluessel}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Räume mit Mängeln:</span>
                          <div className="font-semibold">
                            {formData.raeume.filter(r => r.maengel && r.maengel.trim() !== '').length}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Gesamt Fotos:</span>
                          <div className="font-semibold">
                            {formData.raeume.reduce((sum, r) => sum + r.fotos.length, 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <Button
                        onClick={generateDocument}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Erstelle Protokoll...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5 mr-2" />
                            Übergabeprotokoll erstellen
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Übergabeprotokoll erfolgreich erstellt!
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
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Wichtig:</strong> Das Protokoll sollte von beiden Parteien (Vermieter und Mieter) 
                            unterschrieben werden. Bewahre das Original sicher auf.
                          </span>
                        </p>
                      </div>

                      {formData.protokoll_typ === 'auszug' && formData.renovierung_erforderlich && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                          <p className="text-sm text-yellow-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>Hinweis:</strong> Renovierungsarbeiten wurden als erforderlich markiert. 
                              Kläre zeitnah die Durchführung und ggf. Kostenübernahme.
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
              headline="Übergaben automatisch dokumentieren"
              benefit="Mit Vermietify werden Übergaben strukturiert erfasst, Fotos automatisch zugeordnet und Protokolle direkt generiert."
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