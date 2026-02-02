import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Plus, Trash2, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function UebergabeprotokollGenerator() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Typ
    typ: 'einzug', // einzug oder auszug

    // Parteien
    mieter_name: '',
    vermieter_name: '',
    
    // Objekt
    objekt_adresse: '',
    wohnflaeche: '',
    zimmer: '',
    
    // Datum
    uebergabedatum: '',
    uebergabezeit: '10:00',
    
    // Zustand
    raeume: [
      { art: 'Wohnzimmer', zustand: 'gut', notizen: '' },
      { art: 'Schlafzimmer', zustand: 'gut', notizen: '' },
      { art: 'Küche', zustand: 'gut', notizen: '' },
      { art: 'Bad', zustand: 'gut', notizen: '' },
      { art: 'Flur', zustand: 'gut', notizen: '' }
    ],

    // Besonderheiten
    schluessel_vorhanden: true,
    zaehlerstuende_strom: '',
    zaehlerstuende_wasser: '',
    zaehlerstuende_gas: '',
    schaeden: [],
    
    // Unterschriften
    unterschrift_mieter: false,
    unterschrift_vermieter: false,
    unterschrift_makler: false
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      updateFormData('vermieter_name', currentUser.full_name || '');
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateRaum = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      raeume: prev.raeume.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  const addRaum = () => {
    setFormData(prev => ({
      ...prev,
      raeume: [...prev.raeume, { art: '', zustand: 'gut', notizen: '' }]
    }));
  };

  const removeRaum = (index) => {
    setFormData(prev => ({
      ...prev,
      raeume: prev.raeume.filter((_, i) => i !== index)
    }));
  };

  const addSchaden = () => {
    setFormData(prev => ({
      ...prev,
      schaeden: [...prev.schaeden, { art: '', beschreibung: '', verursacher: 'ungeklaert' }]
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

  const generateDocument = async () => {
    if (!formData.mieter_name || !formData.objekt_adresse || !formData.uebergabedatum) {
      toast.error('Bitte alle erforderlichen Felder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'uebergabeprotokoll',
        data: {
          typ: formData.typ,
          mieter: formData.mieter_name,
          vermieter: formData.vermieter_name,
          objekt: {
            adresse: formData.objekt_adresse,
            wohnflaeche: formData.wohnflaeche,
            zimmer: formData.zimmer
          },
          uebergabe: {
            datum: formData.uebergabedatum,
            zeit: formData.uebergabezeit
          },
          zaehlerstuende: {
            strom: formData.zaehlerstuende_strom,
            wasser: formData.zaehlerstuende_wasser,
            gas: formData.zaehlerstuende_gas
          },
          raeume: formData.raeume.filter(r => r.art),
          schaeden: formData.schaeden,
          schluessel: formData.schluessel_vorhanden,
          datum_unterschrift: new Date().toISOString().split('T')[0]
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Übergabeprotokoll erstellt!');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Übergabeprotokoll Generator
          </h1>
          <p className="text-gray-600">
            Dokumentation des Zustands bei Ein- oder Auszug
          </p>
        </div>

        <FormSection title="Übergabeprotokoll erstellen">
          <div className="space-y-6">
            {!generatedDoc ? (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Art des Protokolls</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border cursor-pointer">
                      <input
                        type="radio"
                        name="typ"
                        value="einzug"
                        checked={formData.typ === 'einzug'}
                        onChange={(e) => updateFormData('typ', e.target.value)}
                      />
                      <span className="font-semibold">Einzugsprotokoll</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border cursor-pointer">
                      <input
                        type="radio"
                        name="typ"
                        value="auszug"
                        checked={formData.typ === 'auszug'}
                        onChange={(e) => updateFormData('typ', e.target.value)}
                      />
                      <span className="font-semibold">Auszugsprotokoll</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Mietername *</Label>
                    <Input
                      value={formData.mieter_name}
                      onChange={(e) => updateFormData('mieter_name', e.target.value)}
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div>
                    <Label>Vermietername</Label>
                    <Input
                      value={formData.vermieter_name}
                      onChange={(e) => updateFormData('vermieter_name', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Objektadresse *</Label>
                  <Input
                    value={formData.objekt_adresse}
                    onChange={(e) => updateFormData('objekt_adresse', e.target.value)}
                    placeholder="Musterstraße 10, 3OG links, 12345 Berlin"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Wohnfläche (m²)</Label>
                    <Input
                      type="number"
                      value={formData.wohnflaeche}
                      onChange={(e) => updateFormData('wohnflaeche', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Zimmer</Label>
                    <Input
                      type="number"
                      value={formData.zimmer}
                      onChange={(e) => updateFormData('zimmer', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Übergabedatum *</Label>
                    <Input
                      type="date"
                      value={formData.uebergabedatum}
                      onChange={(e) => updateFormData('uebergabedatum', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Übergabezeit</Label>
                    <Input
                      type="time"
                      value={formData.uebergabezeit}
                      onChange={(e) => updateFormData('uebergabezeit', e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Zählerstände</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Stromzähler (kWh)</Label>
                      <Input
                        value={formData.zaehlerstuende_strom}
                        onChange={(e) => updateFormData('zaehlerstuende_strom', e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <Label>Wasserzähler (m³)</Label>
                      <Input
                        value={formData.zaehlerstuende_wasser}
                        onChange={(e) => updateFormData('zaehlerstuende_wasser', e.target.value)}
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <Label>Gaszähler (m³)</Label>
                      <Input
                        value={formData.zaehlerstuende_gas}
                        onChange={(e) => updateFormData('zaehlerstuende_gas', e.target.value)}
                        placeholder="456"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Raumzustand</h4>
                    <Button onClick={addRaum} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Raum
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.raeume.map((raum, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Raumbezeichnung"
                            value={raum.art}
                            onChange={(e) => updateRaum(idx, 'art', e.target.value)}
                            className="flex-1"
                          />
                          <select
                            value={raum.zustand}
                            onChange={(e) => updateRaum(idx, 'zustand', e.target.value)}
                            className="rounded border p-2 text-sm"
                          >
                            <option value="gut">Gut</option>
                            <option value="befriedigend">Befriedigend</option>
                            <option value="schadhaft">Schadhaft</option>
                            <option value="stark_beschaedigt">Stark beschädigt</option>
                          </select>
                          {formData.raeume.length > 1 && (
                            <Button
                              onClick={() => removeRaum(idx)}
                              size="icon"
                              variant="ghost"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="Notizen (z.B. kleine Kratzer an Wand)"
                          value={raum.notizen}
                          onChange={(e) => updateRaum(idx, 'notizen', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Schäden</h4>
                    <Button onClick={addSchaden} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Schaden
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.schaeden.map((schaden, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <Input
                          placeholder="Art des Schadens"
                          value={schaden.art}
                          onChange={(e) => updateSchaden(idx, 'art', e.target.value)}
                        />
                        <Textarea
                          placeholder="Beschreibung"
                          value={schaden.beschreibung}
                          onChange={(e) => updateSchaden(idx, 'beschreibung', e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <select
                            value={schaden.verursacher}
                            onChange={(e) => updateSchaden(idx, 'verursacher', e.target.value)}
                            className="rounded border p-2 text-sm flex-1"
                          >
                            <option value="ungeklaert">Unklar</option>
                            <option value="mieter">Mieter</option>
                            <option value="vermieter">Vermieter</option>
                            <option value="verschlei">Verschleiß</option>
                          </select>
                          <Button
                            onClick={() => removeSchaden(idx)}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.schluessel_vorhanden}
                    onCheckedChange={(e) => updateFormData('schluessel_vorhanden', e)}
                  />
                  <span className="text-sm">Schlüssel übernommen/übergeben</span>
                </label>

                <Button
                  onClick={generateDocument}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Protokoll erstellen
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">✓ Protokoll erstellt!</p>
                </div>
                <Button
                  onClick={() => window.open(generatedDoc.document_url, '_blank')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF herunterladen
                </Button>
              </div>
            )}
          </div>
        </FormSection>
      </div>
    </div>
  );
}