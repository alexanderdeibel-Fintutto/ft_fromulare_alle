import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, Plus, Trash2, AlertTriangle, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function Wohnungsgeberbestaetigung() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Wohnungsgeber
    wg_name: '',
    wg_adresse: '',

    // Wohnung
    wohnung_adresse: '',
    wohnung_art: 'einzug', // einzug oder auszug

    // Einziehende Personen
    personen: [
      {
        name: '',
        geburtsdatum: ''
      }
    ],

    // Einzugsdatum
    einzugsdatum: '',

    // Für Auszug
    auszugsdatum: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      updateFormData('wg_name', currentUser.full_name || '');
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPerson = () => {
    setFormData(prev => ({
      ...prev,
      personen: [...prev.personen, { name: '', geburtsdatum: '' }]
    }));
  };

  const removePerson = (index) => {
    setFormData(prev => ({
      ...prev,
      personen: prev.personen.filter((_, i) => i !== index)
    }));
  };

  const updatePerson = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      personen: prev.personen.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const generateDocument = async () => {
    if (!formData.wg_name || !formData.wohnung_adresse || !formData.einzugsdatum) {
      toast.error('Bitte erforderliche Felder ausfüllen');
      return;
    }

    const hatPersonen = formData.personen.some(p => p.name && p.geburtsdatum);
    if (!hatPersonen) {
      toast.error('Bitte mindestens eine einziehende Person angeben');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'wohnungsgeberbestaetigung',
        data: {
          wohnungsgeber: {
            name: formData.wg_name,
            adresse: formData.wg_adresse
          },
          wohnung: {
            adresse: formData.wohnung_adresse
          },
          einziehende_personen: formData.personen.filter(p => p.name && p.geburtsdatum),
          einzugsdatum: formData.wohnung_art === 'einzug' ? formData.einzugsdatum : null,
          auszugsdatum: formData.wohnung_art === 'auszug' ? formData.auszugsdatum : null,
          art: formData.wohnung_art,
          datum: new Date().toISOString().split('T')[0]
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Wohnungsgeberbestätigung erstellt!');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (email) => {
    if (!generatedDoc) return;
    setLoading(true);
    try {
      await base44.functions.invoke('sendDocumentEmail', {
        document_url: generatedDoc.document_url,
        recipient: {
          email: email,
          name: formData.personen[0]?.name || 'Mieter'
        },
        email_template: 'wohnungsgeberbestaetigung'
      });
      toast.success('Bestätigung versendet!');
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Wohnungsgeberbestätigung (§19 BMG)
          </h1>
          <p className="text-gray-600">
            Pflichtdokument für die Anmeldung beim Einwohnermeldeamt
          </p>
        </div>

        <FormSection title="Wohnungsgeberbestätigung erstellen">
          <div className="space-y-6">
            {!generatedDoc ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-semibold">⚠️ PFLICHTDOKUMENT!</p>
                      <p className="text-sm text-red-700 mt-1">
                        Sie müssen diese Bestätigung innerhalb von 2 Wochen nach Einzug ausstellen.
                        Bei Verstoß: Bußgeld bis 1.000€!
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Wohnungsgeber (Sie)</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={formData.wg_name}
                        onChange={(e) => updateFormData('wg_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Anschrift</Label>
                      <Input
                        value={formData.wg_adresse}
                        onChange={(e) => updateFormData('wg_adresse', e.target.value)}
                        placeholder="Vermieterweg 1, 12345 Berlin"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Wohnung</h4>
                  <div>
                    <Label>Anschrift *</Label>
                    <Input
                      value={formData.wohnung_adresse}
                      onChange={(e) => updateFormData('wohnung_adresse', e.target.value)}
                      placeholder="Musterstraße 10, 3OG links, 12345 Berlin"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Einziehende Personen</h4>
                  <div className="space-y-3">
                    {formData.personen.map((person, idx) => (
                      <div key={idx} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Name, Vorname"
                              value={person.name}
                              onChange={(e) => updatePerson(idx, 'name', e.target.value)}
                            />
                            <Input
                              type="date"
                              value={person.geburtsdatum}
                              onChange={(e) => updatePerson(idx, 'geburtsdatum', e.target.value)}
                            />
                          </div>
                          {formData.personen.length > 1 && (
                            <Button
                              onClick={() => removePerson(idx)}
                              size="icon"
                              variant="ghost"
                              className="ml-2"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addPerson}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Weitere Person hinzufügen
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Art des Vorgangs</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border cursor-pointer">
                      <input
                        type="radio"
                        name="art"
                        value="einzug"
                        checked={formData.wohnung_art === 'einzug'}
                        onChange={(e) => updateFormData('wohnung_art', e.target.value)}
                      />
                      <span className="text-sm font-semibold">Einzug</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border cursor-pointer">
                      <input
                        type="radio"
                        name="art"
                        value="auszug"
                        checked={formData.wohnung_art === 'auszug'}
                        onChange={(e) => updateFormData('wohnung_art', e.target.value)}
                      />
                      <span className="text-sm font-semibold">Auszug</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Datum</h4>
                  {formData.wohnung_art === 'einzug' ? (
                    <div>
                      <Label>Einzugsdatum *</Label>
                      <Input
                        type="date"
                        value={formData.einzugsdatum}
                        onChange={(e) => updateFormData('einzugsdatum', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label>Auszugsdatum *</Label>
                      <Input
                        type="date"
                        value={formData.auszugsdatum}
                        onChange={(e) => updateFormData('auszugsdatum', e.target.value)}
                      />
                    </div>
                  )}
                </div>

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
                      Bestätigung erstellen
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">✓ Wohnungsgeberbestätigung erstellt!</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => window.open(generatedDoc.document_url, '_blank')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF herunterladen
                  </Button>
                  <Button
                    onClick={() => sendEmail(formData.personen[0]?.email || '')}
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email senden
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setGeneratedDoc(null);
                    setFormData({
                      wg_name: user?.full_name || '',
                      wg_adresse: '',
                      wohnung_adresse: '',
                      wohnung_art: 'einzug',
                      personen: [{ name: '', geburtsdatum: '' }],
                      einzugsdatum: '',
                      auszugsdatum: ''
                    });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Neue Bestätigung erstellen
                </Button>
              </div>
            )}
          </div>
        </FormSection>
      </div>
    </div>
  );
}