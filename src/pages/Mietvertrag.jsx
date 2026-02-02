import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Download, Mail, Save } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';
import VermietifyPromo from '../components/wizard/VermietifyPromo';

export default function Mietvertrag() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Vermieter
    vermieter_name: '',
    vermieter_adresse: '',
    vermieter_plz: '',
    vermieter_ort: '',
    vermieter_telefon: '',
    vermieter_email: '',
    vermieter_bank: '',
    vermieter_iban: '',
    vermieter_bic: '',
    vermieter_steuernummer: '',
    
    // Schritt 2: Mieter
    mieter_name: '',
    mieter_vorname: '',
    mieter_geburtsdatum: '',
    mieter_aktuell_adresse: '',
    mieter_aktuell_plz: '',
    mieter_aktuell_ort: '',
    mieter_telefon: '',
    mieter_email: '',
    weitere_mieter: [],
    
    // Schritt 3: Objekt
    objekt_strasse: '',
    objekt_hausnr: '',
    objekt_plz: '',
    objekt_ort: '',
    objekt_etage: '',
    objekt_lage: '',
    objekt_wohnflaeche: '',
    objekt_zimmer: '',
    objekt_ausstattung: {
      einbaukueche: false,
      balkon: false,
      terrasse: false,
      garten: false,
      keller: false,
      stellplatz: false,
      garage: false,
      aufzug: false,
    },
    energieausweis_typ: '',
    energieausweis_klasse: '',
    energieausweis_wert: '',
    energieausweis_gueltig_bis: '',
    
    // Schritt 4: Mietkonditionen
    kaltmiete: '',
    nebenkosten_vorauszahlung: '',
    kaution: '',
    kaution_raten: '3',
    mietbeginn: '',
    befristet: false,
    befristet_bis: '',
    befristungsgrund: '',
    
    // Schritt 5: Zusatzvereinbarungen
    haustiere_erlaubt: false,
    haustiere_zustimmung: false,
    untervermietung_erlaubt: false,
    kleinreparatur_grenze: '100',
    kleinreparatur_jahresgrenze: '',
    schoenheitsreparaturen: 'vermieter',
    sonstiges: '',
    
    // Schritt 6: Hausordnung
    ruhezeiten_werktags_mittags: '13:00-15:00',
    ruhezeiten_werktags_abends: '22:00-07:00',
    ruhezeiten_sonntags: 'ganztägig',
    treppenhaus_reinigung: 'wöchentlich',
    muell_entsorgung: 'nach Abfuhrplan',
    waschkueche_nutzung: '',
    sonstige_regeln: '',
  });

  const steps = [
    'Vermieter',
    'Mieter',
    'Objekt',
    'Konditionen',
    'Vereinbarungen',
    'Hausordnung',
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
      // Vermieter-Daten aus User vorausfüllen
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          vermieter_name: currentUser.full_name || '',
          vermieter_email: currentUser.email || '',
        }));
      }
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const autoSave = async () => {
    try {
      await base44.functions.invoke('saveDocument', {
        template_id: 'mietvertrag',
        document_name: `Mietvertrag ${formData.objekt_strasse || 'Entwurf'}`,
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

  const updateAusstattung = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      objekt_ausstattung: { ...prev.objekt_ausstattung, [field]: checked }
    }));
  };

  const validateKaution = () => {
    const kaltmiete = parseFloat(formData.kaltmiete) || 0;
    const kaution = parseFloat(formData.kaution) || 0;
    const maxKaution = kaltmiete * 3;
    
    if (kaution > maxKaution) {
      return {
        valid: false,
        message: `Die Kaution darf maximal 3 Kaltmieten betragen (${maxKaution.toFixed(2)} €). Ihre Eingabe: ${kaution.toFixed(2)} €`
      };
    }
    return { valid: true };
  };

  const nextStep = () => {
    // Validierung je Schritt
    if (currentStep === 1) {
      if (!formData.vermieter_name || !formData.vermieter_adresse) {
        toast.error('Bitte alle Pflichtfelder ausfüllen');
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!formData.mieter_name || !formData.mieter_vorname) {
        toast.error('Bitte Mieter-Daten eingeben');
        return;
      }
    }
    
    if (currentStep === 3) {
      if (!formData.objekt_strasse || !formData.objekt_wohnflaeche) {
        toast.error('Bitte Objekt-Daten eingeben');
        return;
      }
    }
    
    if (currentStep === 4) {
      if (!formData.kaltmiete || !formData.mietbeginn) {
        toast.error('Bitte Mietkonditionen angeben');
        return;
      }
      
      const kautionCheck = validateKaution();
      if (!kautionCheck.valid) {
        toast.error(kautionCheck.message);
        return;
      }
      
      if (formData.befristet && !formData.befristungsgrund) {
        toast.error('Befristung ist nur mit Grund zulässig (§ 575 BGB)');
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 7));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generateDocument = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'mietvertrag',
        data: {
          vermieter: {
            name: formData.vermieter_name,
            adresse: `${formData.vermieter_adresse}, ${formData.vermieter_plz} ${formData.vermieter_ort}`,
            telefon: formData.vermieter_telefon,
            email: formData.vermieter_email,
            bank: formData.vermieter_bank,
            iban: formData.vermieter_iban,
            bic: formData.vermieter_bic,
          },
          mieter: {
            name: `${formData.mieter_vorname} ${formData.mieter_name}`,
            geburtsdatum: formData.mieter_geburtsdatum,
            adresse: `${formData.mieter_aktuell_adresse}, ${formData.mieter_aktuell_plz} ${formData.mieter_aktuell_ort}`,
            telefon: formData.mieter_telefon,
            email: formData.mieter_email,
          },
          objekt: {
            adresse: `${formData.objekt_strasse} ${formData.objekt_hausnr}, ${formData.objekt_plz} ${formData.objekt_ort}`,
            etage: formData.objekt_etage,
            lage: formData.objekt_lage,
            wohnflaeche: formData.objekt_wohnflaeche,
            zimmer: formData.objekt_zimmer,
            ausstattung: formData.objekt_ausstattung,
            energieausweis: {
              typ: formData.energieausweis_typ,
              klasse: formData.energieausweis_klasse,
              wert: formData.energieausweis_wert,
              gueltig_bis: formData.energieausweis_gueltig_bis,
            }
          },
          konditionen: {
            kaltmiete: formData.kaltmiete,
            nebenkosten: formData.nebenkosten_vorauszahlung,
            kaution: formData.kaution,
            kaution_raten: formData.kaution_raten,
            mietbeginn: formData.mietbeginn,
            befristet: formData.befristet,
            befristet_bis: formData.befristet_bis,
            befristungsgrund: formData.befristungsgrund,
          },
          vereinbarungen: {
            haustiere_erlaubt: formData.haustiere_erlaubt,
            haustiere_zustimmung: formData.haustiere_zustimmung,
            untervermietung: formData.untervermietung_erlaubt,
            kleinreparatur: formData.kleinreparatur_grenze,
            schoenheitsreparaturen: formData.schoenheitsreparaturen,
            sonstiges: formData.sonstiges,
          },
          hausordnung: {
            ruhezeiten: {
              werktags_mittags: formData.ruhezeiten_werktags_mittags,
              werktags_abends: formData.ruhezeiten_werktags_abends,
              sonntags: formData.ruhezeiten_sonntags,
            },
            reinigung: formData.treppenhaus_reinigung,
            muell: formData.muell_entsorgung,
            waschkueche: formData.waschkueche_nutzung,
            sonstiges: formData.sonstige_regeln,
          }
        },
        options: { has_watermark: true }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Mietvertrag erfolgreich erstellt');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen des Vertrags');
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
          email: formData.mieter_email,
          name: `${formData.mieter_vorname} ${formData.mieter_name}`
        },
        email_template: 'mietvertrag',
        context: {
          objekt: `${formData.objekt_strasse} ${formData.objekt_hausnr}`,
          mietbeginn: formData.mietbeginn
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📄 Mietvertrag erstellen
          </h1>
          <p className="text-gray-600">
            Erstelle einen rechtssicheren Wohnraum-Mietvertrag
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={7} steps={steps} />

        {/* Schritt 1: Vermieter */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 7: Vermieter-Daten">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name / Firma *</Label>
                  <Input
                    value={formData.vermieter_name}
                    onChange={(e) => updateFormData('vermieter_name', e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.vermieter_email}
                    onChange={(e) => updateFormData('vermieter_email', e.target.value)}
                    placeholder="vermieter@example.com"
                  />
                </div>
              </div>

              <div>
                <Label>Straße, Hausnummer *</Label>
                <Input
                  value={formData.vermieter_adresse}
                  onChange={(e) => updateFormData('vermieter_adresse', e.target.value)}
                  placeholder="Musterstraße 1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>PLZ *</Label>
                  <Input
                    value={formData.vermieter_plz}
                    onChange={(e) => updateFormData('vermieter_plz', e.target.value)}
                    placeholder="12345"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Ort *</Label>
                  <Input
                    value={formData.vermieter_ort}
                    onChange={(e) => updateFormData('vermieter_ort', e.target.value)}
                    placeholder="Berlin"
                  />
                </div>
              </div>

              <div>
                <Label>Telefon</Label>
                <Input
                  value={formData.vermieter_telefon}
                  onChange={(e) => updateFormData('vermieter_telefon', e.target.value)}
                  placeholder="+49 30 12345678"
                />
              </div>

              <div className="border-t pt-4 mt-6">
                <h4 className="font-semibold mb-3">Bankverbindung</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Bank / Institut</Label>
                    <Input
                      value={formData.vermieter_bank}
                      onChange={(e) => updateFormData('vermieter_bank', e.target.value)}
                      placeholder="Deutsche Bank"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>IBAN</Label>
                      <Input
                        value={formData.vermieter_iban}
                        onChange={(e) => updateFormData('vermieter_iban', e.target.value)}
                        placeholder="DE89 3704 0044 0532 0130 00"
                      />
                    </div>
                    <div>
                      <Label>BIC</Label>
                      <Input
                        value={formData.vermieter_bic}
                        onChange={(e) => updateFormData('vermieter_bic', e.target.value)}
                        placeholder="COBADEFFXXX"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Steuernummer (optional)</Label>
                <Input
                  value={formData.vermieter_steuernummer}
                  onChange={(e) => updateFormData('vermieter_steuernummer', e.target.value)}
                  placeholder="12/345/67890"
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Mieter */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 7: Mieter-Daten">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Vorname *</Label>
                  <Input
                    value={formData.mieter_vorname}
                    onChange={(e) => updateFormData('mieter_vorname', e.target.value)}
                    placeholder="Anna"
                  />
                </div>
                <div>
                  <Label>Nachname *</Label>
                  <Input
                    value={formData.mieter_name}
                    onChange={(e) => updateFormData('mieter_name', e.target.value)}
                    placeholder="Beispiel"
                  />
                </div>
              </div>

              <div>
                <Label>Geburtsdatum</Label>
                <Input
                  type="date"
                  value={formData.mieter_geburtsdatum}
                  onChange={(e) => updateFormData('mieter_geburtsdatum', e.target.value)}
                />
              </div>

              <div className="border-t pt-4 mt-6">
                <h4 className="font-semibold mb-3">Aktuelle Anschrift</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Straße, Hausnummer</Label>
                    <Input
                      value={formData.mieter_aktuell_adresse}
                      onChange={(e) => updateFormData('mieter_aktuell_adresse', e.target.value)}
                      placeholder="Alte Straße 5"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>PLZ</Label>
                      <Input
                        value={formData.mieter_aktuell_plz}
                        onChange={(e) => updateFormData('mieter_aktuell_plz', e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Ort</Label>
                      <Input
                        value={formData.mieter_aktuell_ort}
                        onChange={(e) => updateFormData('mieter_aktuell_ort', e.target.value)}
                        placeholder="Berlin"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={formData.mieter_telefon}
                    onChange={(e) => updateFormData('mieter_telefon', e.target.value)}
                    placeholder="+49 30 87654321"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.mieter_email}
                    onChange={(e) => updateFormData('mieter_email', e.target.value)}
                    placeholder="mieter@example.com"
                  />
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Objekt */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 7: Objekt-Daten">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Label>Straße *</Label>
                  <Input
                    value={formData.objekt_strasse}
                    onChange={(e) => updateFormData('objekt_strasse', e.target.value)}
                    placeholder="Musterstraße"
                  />
                </div>
                <div>
                  <Label>Hausnr. *</Label>
                  <Input
                    value={formData.objekt_hausnr}
                    onChange={(e) => updateFormData('objekt_hausnr', e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>PLZ *</Label>
                  <Input
                    value={formData.objekt_plz}
                    onChange={(e) => updateFormData('objekt_plz', e.target.value)}
                    placeholder="12345"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Ort *</Label>
                  <Input
                    value={formData.objekt_ort}
                    onChange={(e) => updateFormData('objekt_ort', e.target.value)}
                    placeholder="Berlin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Etage</Label>
                  <Input
                    value={formData.objekt_etage}
                    onChange={(e) => updateFormData('objekt_etage', e.target.value)}
                    placeholder="3. OG"
                  />
                </div>
                <div>
                  <Label>Lage</Label>
                  <Input
                    value={formData.objekt_lage}
                    onChange={(e) => updateFormData('objekt_lage', e.target.value)}
                    placeholder="links"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Wohnfläche (m²) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.objekt_wohnflaeche}
                    onChange={(e) => updateFormData('objekt_wohnflaeche', e.target.value)}
                    placeholder="75.50"
                  />
                </div>
                <div>
                  <Label>Anzahl Zimmer</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.objekt_zimmer}
                    onChange={(e) => updateFormData('objekt_zimmer', e.target.value)}
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <h4 className="font-semibold mb-3">Ausstattung</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries({
                    einbaukueche: 'Einbauküche',
                    balkon: 'Balkon',
                    terrasse: 'Terrasse',
                    garten: 'Garten',
                    keller: 'Keller',
                    stellplatz: 'Stellplatz',
                    garage: 'Garage',
                    aufzug: 'Aufzug'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.objekt_ausstattung[key]}
                        onCheckedChange={(checked) => updateAusstattung(key, checked)}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <h4 className="font-semibold mb-3">Energieausweis</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Typ</Label>
                      <Select
                        value={formData.energieausweis_typ}
                        onValueChange={(val) => updateFormData('energieausweis_typ', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verbrauch">Verbrauchsausweis</SelectItem>
                          <SelectItem value="bedarf">Bedarfsausweis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Energieklasse</Label>
                      <Select
                        value={formData.energieausweis_klasse}
                        onValueChange={(val) => updateFormData('energieausweis_klasse', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(klasse => (
                            <SelectItem key={klasse} value={klasse}>{klasse}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Energiekennwert (kWh/m²a)</Label>
                      <Input
                        type="number"
                        value={formData.energieausweis_wert}
                        onChange={(e) => updateFormData('energieausweis_wert', e.target.value)}
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <Label>Gültig bis</Label>
                      <Input
                        type="date"
                        value={formData.energieausweis_gueltig_bis}
                        onChange={(e) => updateFormData('energieausweis_gueltig_bis', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Mietkonditionen */}
        {currentStep === 4 && (
          <FormSection title="Schritt 4 von 7: Mietkonditionen">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kaltmiete (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.kaltmiete}
                    onChange={(e) => updateFormData('kaltmiete', e.target.value)}
                    placeholder="850.00"
                  />
                </div>
                <div>
                  <Label>Nebenkosten-Vorauszahlung (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.nebenkosten_vorauszahlung}
                    onChange={(e) => updateFormData('nebenkosten_vorauszahlung', e.target.value)}
                    placeholder="200.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kaution (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.kaution}
                    onChange={(e) => updateFormData('kaution', e.target.value)}
                    placeholder="2550.00"
                  />
                  {formData.kaltmiete && formData.kaution && (
                    <div className="text-xs mt-1">
                      {(() => {
                        const check = validateKaution();
                        return (
                          <span className={check.valid ? 'text-green-600' : 'text-red-600'}>
                            {check.valid 
                              ? `✓ Max. ${(parseFloat(formData.kaltmiete) * 3).toFixed(2)} € erlaubt`
                              : check.message
                            }
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Kaution in Raten</Label>
                  <Select
                    value={formData.kaution_raten}
                    onValueChange={(val) => updateFormData('kaution_raten', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Rate (sofort)</SelectItem>
                      <SelectItem value="2">2 Raten</SelectItem>
                      <SelectItem value="3">3 Raten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Mietbeginn *</Label>
                <Input
                  type="date"
                  value={formData.mietbeginn}
                  onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                />
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    checked={formData.befristet}
                    onCheckedChange={(checked) => updateFormData('befristet', checked)}
                  />
                  <Label>Befristetes Mietverhältnis</Label>
                </div>

                {formData.befristet && (
                  <div className="space-y-4 ml-6">
                    <div>
                      <Label>Befristet bis *</Label>
                      <Input
                        type="date"
                        value={formData.befristet_bis}
                        onChange={(e) => updateFormData('befristet_bis', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Befristungsgrund (§ 575 BGB) *</Label>
                      <Textarea
                        value={formData.befristungsgrund}
                        onChange={(e) => updateFormData('befristungsgrund', e.target.value)}
                        placeholder="z.B. Eigenbedarf nach Ablauf, betriebliche Nutzung geplant..."
                        rows={3}
                      />
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">
                          Befristung ist nur zulässig bei berechtigtem Interesse (§ 575 BGB):<br />
                          • Eigenbedarf nach Ablauf<br />
                          • Umfassende Modernisierung geplant<br />
                          • Betriebliche oder gewerbliche Nutzung vorgesehen
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 5: Zusatzvereinbarungen */}
        {currentStep === 5 && (
          <FormSection title="Schritt 5 von 7: Zusätzliche Vereinbarungen">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Haustiere</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.haustiere_erlaubt}
                      onCheckedChange={(checked) => updateFormData('haustiere_erlaubt', checked)}
                    />
                    <span className="text-sm">Haustiere grundsätzlich erlaubt</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.haustiere_zustimmung}
                      onCheckedChange={(checked) => updateFormData('haustiere_zustimmung', checked)}
                    />
                    <span className="text-sm">Haustiere nur mit vorheriger Zustimmung</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Untervermietung</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.untervermietung_erlaubt}
                    onCheckedChange={(checked) => updateFormData('untervermietung_erlaubt', checked)}
                  />
                  <span className="text-sm">Untervermietung mit Zustimmung möglich</span>
                </label>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Kleinreparaturklausel</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Obergrenze Einzelfall (€)</Label>
                    <Input
                      type="number"
                      value={formData.kleinreparatur_grenze}
                      onChange={(e) => updateFormData('kleinreparatur_grenze', e.target.value)}
                      placeholder="100"
                    />
                    <p className="text-xs text-gray-600 mt-1">Üblich: 100-120 €</p>
                  </div>
                  <div>
                    <Label>Jahresgrenze (€)</Label>
                    <Input
                      type="number"
                      value={formData.kleinreparatur_jahresgrenze}
                      onChange={(e) => updateFormData('kleinreparatur_jahresgrenze', e.target.value)}
                      placeholder="200"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {formData.kaltmiete && `Empfohlen: max. ${(parseFloat(formData.kaltmiete) * 12 * 0.08).toFixed(2)} € (8% der Jahresmiete)`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Schönheitsreparaturen</h4>
                <Select
                  value={formData.schoenheitsreparaturen}
                  onValueChange={(val) => updateFormData('schoenheitsreparaturen', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vermieter">Trägt der Vermieter (Standard)</SelectItem>
                    <SelectItem value="mieter">Trägt der Mieter (nur bei unrenovierter Übergabe!)</SelectItem>
                    <SelectItem value="quotiert">Quotierte Beteiligung</SelectItem>
                  </SelectContent>
                </Select>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Starre Fristen oder Endrenovierungsklauseln sind unwirksam (BGH-Rechtsprechung).
                    Bei renoviert übergebener Wohnung trägt i.d.R. der Vermieter die Schönheitsreparaturen.
                  </p>
                </div>
              </div>

              <div>
                <Label>Sonstige Vereinbarungen</Label>
                <Textarea
                  value={formData.sonstiges}
                  onChange={(e) => updateFormData('sonstiges', e.target.value)}
                  placeholder="Weitere individuelle Vereinbarungen..."
                  rows={4}
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 6: Hausordnung */}
        {currentStep === 6 && (
          <FormSection title="Schritt 6 von 7: Hausordnung">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Ruhezeiten</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Werktags Mittagsruhe</Label>
                    <Input
                      value={formData.ruhezeiten_werktags_mittags}
                      onChange={(e) => updateFormData('ruhezeiten_werktags_mittags', e.target.value)}
                      placeholder="13:00-15:00"
                    />
                  </div>
                  <div>
                    <Label>Werktags Nachtruhe</Label>
                    <Input
                      value={formData.ruhezeiten_werktags_abends}
                      onChange={(e) => updateFormData('ruhezeiten_werktags_abends', e.target.value)}
                      placeholder="22:00-07:00"
                    />
                  </div>
                  <div>
                    <Label>Sonn- und Feiertage</Label>
                    <Input
                      value={formData.ruhezeiten_sonntags}
                      onChange={(e) => updateFormData('ruhezeiten_sonntags', e.target.value)}
                      placeholder="ganztägig"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Treppenhaus-Reinigung</Label>
                <Input
                  value={formData.treppenhaus_reinigung}
                  onChange={(e) => updateFormData('treppenhaus_reinigung', e.target.value)}
                  placeholder="wöchentlich nach Putzplan"
                />
              </div>

              <div>
                <Label>Müllentsorgung</Label>
                <Input
                  value={formData.muell_entsorgung}
                  onChange={(e) => updateFormData('muell_entsorgung', e.target.value)}
                  placeholder="nach städtischem Abfuhrplan"
                />
              </div>

              <div>
                <Label>Waschküchen-Nutzung</Label>
                <Input
                  value={formData.waschkueche_nutzung}
                  onChange={(e) => updateFormData('waschkueche_nutzung', e.target.value)}
                  placeholder="nach Belegungsplan, nicht an Sonn- und Feiertagen"
                />
              </div>

              <div>
                <Label>Sonstige Regelungen</Label>
                <Textarea
                  value={formData.sonstige_regeln}
                  onChange={(e) => updateFormData('sonstige_regeln', e.target.value)}
                  placeholder="Weitere Hausordnungsregeln..."
                  rows={4}
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 7: Dokument */}
        {currentStep === 7 && (
          <div>
            <FormSection title="Schritt 7 von 7: Mietvertrag erstellen">
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
                          Erstelle Mietvertrag...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Mietvertrag erstellen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-semibold mb-2">
                        ✓ Mietvertrag erfolgreich erstellt!
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
                        An Mieter senden
                      </Button>
                      <Button
                        onClick={autoSave}
                        variant="outline"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Speichern
                      </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Wichtig:</strong> Der Mietvertrag muss von beiden Parteien unterschrieben werden.
                        Erstelle 2 Exemplare - eines für dich, eines für den Mieter.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <VermietifyPromo
              headline="Mietverträge automatisch verwalten"
              benefit="Mit Vermietify verwaltest du alle Mietverträge zentral, mit automatischen Erinnerungen für Fristen und Kündigungen."
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
            disabled={loading || (currentStep === 7 && !generatedDoc)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentStep === 7 ? (
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