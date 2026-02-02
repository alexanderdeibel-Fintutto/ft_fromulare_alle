import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function HausordnungGenerator() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    gebaeudeadresse: '',
    hausverwaltung_name: '',
    hausverwaltung_kontakt: '',
    
    // Optionen
    regelungen: {
      reinigung: true,
      ruhezeiten: true,
      haustiere: true,
      gebuehren: true,
      heizung_warmwasser: true,
      garten_hof: true,
      fahrstuhl: true,
      strom_gas: true,
      versicherung: true,
      parkplaetze: true,
      fahrradstaender: true,
      muellverwirtschaftung: true,
      aussenanlagen: true,
      schneebeseitigung: true,
      instandhaltung: true
    },
    
    // Custom
    custom_regelungen: [],
    
    // Details
    stille_stunden_beginn: '22:00',
    stille_stunden_ende: '06:00',
    haustiere_erlaubt: false,
    haustiere_text: '',
    garten_erlaubt: false,
    parkplaetze_anzahl: 0
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleRegelung = (rule) => {
    setFormData(prev => ({
      ...prev,
      regelungen: {
        ...prev.regelungen,
        [rule]: !prev.regelungen[rule]
      }
    }));
  };

  const generateDocument = async () => {
    if (!formData.gebaeudeadresse) {
      toast.error('Bitte Gebäudeadresse angeben');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'hausordnung',
        data: {
          adresse: formData.gebaeudeadresse,
          hausverwaltung: {
            name: formData.hausverwaltung_name,
            kontakt: formData.hausverwaltung_kontakt
          },
          regelungen: formData.regelungen,
          custom_regelungen: formData.custom_regelungen,
          details: {
            stille_stunden_beginn: formData.stille_stunden_beginn,
            stille_stunden_ende: formData.stille_stunden_ende,
            haustiere_erlaubt: formData.haustiere_erlaubt,
            haustiere_text: formData.haustiere_text,
            garten_erlaubt: formData.garten_erlaubt,
            parkplaetze_anzahl: formData.parkplaetze_anzahl
          },
          datum: new Date().toISOString().split('T')[0]
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Hausordnung erstellt!');
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
            📋 Hausordnung Generator
          </h1>
          <p className="text-gray-600">
            Professionelle Hausordnung für dein Gebäude
          </p>
        </div>

        <FormSection title="Hausordnung erstellen">
          <div className="space-y-6">
            {!generatedDoc ? (
              <>
                <div>
                  <Label>Gebäudeadresse *</Label>
                  <Input
                    value={formData.gebaeudeadresse}
                    onChange={(e) => updateFormData('gebaeudeadresse', e.target.value)}
                    placeholder="Musterstraße 10, 12345 Berlin"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Hausverwaltung (Name)</Label>
                    <Input
                      value={formData.hausverwaltung_name}
                      onChange={(e) => updateFormData('hausverwaltung_name', e.target.value)}
                      placeholder="XY Hausverwaltung GmbH"
                    />
                  </div>
                  <div>
                    <Label>Kontakt</Label>
                    <Input
                      value={formData.hausverwaltung_kontakt}
                      onChange={(e) => updateFormData('hausverwaltung_kontakt', e.target.value)}
                      placeholder="030 123456 oder kontakt@hv.de"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4 text-gray-900">Regelungen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(formData.regelungen).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <Checkbox
                          checked={value}
                          onCheckedChange={() => toggleRegelung(key)}
                        />
                        <span className="text-sm">
                          {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Details</h4>
                  
                  {formData.regelungen.ruhezeiten && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Stille Stunden ab:</Label>
                        <Input
                          type="time"
                          value={formData.stille_stunden_beginn}
                          onChange={(e) => updateFormData('stille_stunden_beginn', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Stille Stunden bis:</Label>
                        <Input
                          type="time"
                          value={formData.stille_stunden_ende}
                          onChange={(e) => updateFormData('stille_stunden_ende', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {formData.regelungen.haustiere && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.haustiere_erlaubt}
                          onCheckedChange={(e) => updateFormData('haustiere_erlaubt', e)}
                        />
                        <span className="text-sm">Haustiere erlaubt</span>
                      </label>
                      {formData.haustiere_erlaubt && (
                        <Input
                          placeholder="z.B. max. 1 kleine Katze oder Hund"
                          value={formData.haustiere_text}
                          onChange={(e) => updateFormData('haustiere_text', e.target.value)}
                        />
                      )}
                    </div>
                  )}

                  {formData.regelungen.garten_hof && (
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.garten_erlaubt}
                        onCheckedChange={(e) => updateFormData('garten_erlaubt', e)}
                      />
                      <span className="text-sm">Privatnutzung Garten/Hof erlaubt</span>
                    </label>
                  )}

                  {formData.regelungen.parkplaetze && (
                    <div>
                      <Label className="text-sm">Anzahl Parkplätze pro Wohnung</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.parkplaetze_anzahl}
                        onChange={(e) => updateFormData('parkplaetze_anzahl', e.target.value)}
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
                      Hausordnung erstellen
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">✓ Hausordnung erstellt!</p>
                </div>
                <Button
                  onClick={() => window.open(generatedDoc.document_url, '_blank')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF herunterladen
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedDoc(null);
                    setFormData({
                      gebaeudeadresse: '',
                      hausverwaltung_name: '',
                      hausverwaltung_kontakt: '',
                      regelungen: {
                        reinigung: true,
                        ruhezeiten: true,
                        haustiere: true,
                        gebuehren: true,
                        heizung_warmwasser: true,
                        garten_hof: true,
                        fahrstuhl: true,
                        strom_gas: true,
                        versicherung: true,
                        parkplaetze: true,
                        fahrradstaender: true,
                        muellverwirtschaftung: true,
                        aussenanlagen: true,
                        schneebeseitigung: true,
                        instandhaltung: true
                      },
                      custom_regelungen: [],
                      stille_stunden_beginn: '22:00',
                      stille_stunden_ende: '06:00',
                      haustiere_erlaubt: false,
                      haustiere_text: '',
                      garten_erlaubt: false,
                      parkplaetze_anzahl: 0
                    });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Neue Hausordnung erstellen
                </Button>
              </div>
            )}
          </div>
        </FormSection>
      </div>
    </div>
  );
}