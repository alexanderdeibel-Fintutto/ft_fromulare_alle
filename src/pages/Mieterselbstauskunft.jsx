import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Copy, Mail, Download, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';

export default function Mieterselbstauskunft() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [shareLink, setShareLink] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Felder auswählen
    abgefragte_felder: {
      name: true,
      geburtsdatum: true,
      telefon: true,
      email: true,
      beruf: false,
      arbeitgeber: false,
      nettoeinkommen: false,
      einkommen_nachweis: false,
      vermieter_name: false,
      vermieter_kontakt: false,
      umzugsgrund: false,
      einzugstermin: false,
      personenzahl: false,
      mietschulden: false,
      schufa_upload: false,
      haustiere: false,
      raucher: false,
      fahrzeuge: false
    },

    // Schritt 2: Objekt-Infos
    objekt_adresse: '',
    objekt_etage: '',
    wohnflaeche: '',
    zimmer: '',
    kaltmiete: '',
    nebenkosten: '',
    verfuegbar_ab: '',

    // Schritt 3: Datenschutz & Einstellungen
    aufbewahrungsfrist_monate: 6,
    max_submissions: 10,
    gueltigkeit_tage: 14,
    datenschutz_text_custom: '',
    weitere_kontakte_erlauben: false,

    // Schritt 4: Link generieren
    form_name: ''
  });

  const feldkatalog = [
    { id: 'name', label: 'Name, Vorname, Geburtsdatum', pflicht: true },
    { id: 'telefon', label: 'Telefon & Email', pflicht: true },
    { id: 'beruf', label: 'Beruf / Arbeitgeber' },
    { id: 'nettoeinkommen', label: 'Monatliches Nettoeinkommen' },
    { id: 'einkommen_nachweis', label: 'Einkommensnachweis hochladen' },
    { id: 'vermieter_name', label: 'Aktueller Vermieter (Name, Kontakt)' },
    { id: 'umzugsgrund', label: 'Grund des Umzugs' },
    { id: 'einzugstermin', label: 'Gewünschter Einzugstermin' },
    { id: 'personenzahl', label: 'Anzahl einziehender Personen' },
    { id: 'mietschulden', label: 'Mietschulden in den letzten 5 Jahren?' },
    { id: 'schufa_upload', label: 'SCHUFA-Auskunft hochladen' },
    { id: 'haustiere', label: 'Haustiere (Anzahl, Art)' },
    { id: 'raucher', label: 'Raucher/Nichtraucher' },
    { id: 'fahrzeuge', label: 'Fahrzeuge (PKW/Stellplatz benötigt?)' }
  ];

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

  const updateFormData = (section, field, value) => {
    if (section === 'felder') {
      setFormData(prev => ({
        ...prev,
        abgefragte_felder: {
          ...prev.abgefragte_felder,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const toggleFeld = (feldId) => {
    updateFormData('felder', feldId, !formData.abgefragte_felder[feldId]);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const gewaehlt = Object.values(formData.abgefragte_felder).filter(v => v).length;
      if (gewaehlt < 3) {
        toast.error('Bitte mindestens 3 Felder auswählen');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.objekt_adresse || !formData.kaltmiete) {
        toast.error('Bitte Adresse und Miete angeben');
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.form_name) {
        toast.error('Bitte Name für das Formular angeben');
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const createForm = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('createSelfDisclosureForm', {
        form_name: formData.form_name,
        fields: formData.abgefragte_felder,
        property: {
          address: formData.objekt_adresse,
          floor: formData.objekt_etage,
          area: formData.wohnflaeche,
          rooms: formData.zimmer,
          rent: parseFloat(formData.kaltmiete),
          utilities: formData.nebenkosten ? parseFloat(formData.nebenkosten) : 0,
          available_from: formData.verfuegbar_ab
        },
        settings: {
          max_submissions: parseInt(formData.max_submissions),
          validity_days: parseInt(formData.gueltigkeit_tage),
          retention_months: parseInt(formData.aufbewahrungsfrist_monate),
          allow_further_contacts: formData.weitere_kontakte_erlauben
        }
      });

      if (result.data) {
        setFormConfig(result.data);
        setShareLink(`https://formulare.fintutto.de/s/${result.data.form_id}`);
        toast.success('Formular erstellt!');
      }
    } catch (err) {
      console.error('Create form error:', err);
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!formConfig) return;
    setLoading(true);
    try {
      const result = await base44.functions.invoke('getSelfDisclosureSubmissions', {
        form_id: formConfig.form_id
      });
      setSubmissions(result.data || []);
    } catch (err) {
      console.error('Load submissions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link kopiert!');
  };

  const sendLink = async (email) => {
    setLoading(true);
    try {
      await base44.functions.invoke('sendDocumentRequest', {
        recipient_email: email,
        form_link: shareLink,
        form_name: formData.form_name,
        property: formData.objekt_adresse
      });
      toast.success('Link versendet!');
    } catch (err) {
      console.error('Send error:', err);
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
            📋 Mieterselbstauskunft
          </h1>
          <p className="text-gray-600">
            Professioneller Fragebogen für Mietinteressenten
          </p>
        </div>

        {!formConfig ? (
          <>
            <ProgressSteps currentStep={currentStep} totalSteps={4} steps={['Felder', 'Objekt', 'Einstellungen', 'Fertig']} />

            {/* Schritt 1: Felder auswählen */}
            {currentStep === 1 && (
              <FormSection title="Schritt 1 von 4: Welche Daten abfragen?">
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Hinweis:</strong> Sie können nicht fragen nach Ethnie, Religion, Schwangerschaft, 
                      Familienplanung, Sexueller Orientierung oder Parteizugehörigkeit (AGG).
                    </p>
                  </div>

                  <div className="space-y-4">
                    {feldkatalog.map(feld => (
                      <label key={feld.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                        <Checkbox
                          checked={formData.abgefragte_felder[feld.id]}
                          onCheckedChange={() => toggleFeld(feld.id)}
                          disabled={feld.pflicht}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{feld.label}</div>
                          {feld.pflicht && (
                            <p className="text-xs text-green-600">✓ Pflichtfeld</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Tipp:</strong> Weniger Felder = höhere Ausfüllquote. Konzentrieren Sie sich auf das Wesentliche.
                    </p>
                  </div>
                </div>
              </FormSection>
            )}

            {/* Schritt 2: Objekt-Informationen */}
            {currentStep === 2 && (
              <FormSection title="Schritt 2 von 4: Objektinformationen">
                <div className="space-y-4">
                  <div>
                    <Label>Adresse *</Label>
                    <Input
                      value={formData.objekt_adresse}
                      onChange={(e) => updateFormData('', 'objekt_adresse', e.target.value)}
                      placeholder="Musterstraße 10, 12345 Berlin"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Etage</Label>
                      <Input
                        value={formData.objekt_etage}
                        onChange={(e) => updateFormData('', 'objekt_etage', e.target.value)}
                        placeholder="3. OG"
                      />
                    </div>
                    <div>
                      <Label>Wohnfläche (m²)</Label>
                      <Input
                        type="number"
                        value={formData.wohnflaeche}
                        onChange={(e) => updateFormData('', 'wohnflaeche', e.target.value)}
                        placeholder="75"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Zimmer</Label>
                      <Input
                        value={formData.zimmer}
                        onChange={(e) => updateFormData('', 'zimmer', e.target.value)}
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <Label>Kaltmiete (€) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.kaltmiete}
                        onChange={(e) => updateFormData('', 'kaltmiete', e.target.value)}
                        placeholder="1050.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nebenkosten (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.nebenkosten}
                        onChange={(e) => updateFormData('', 'nebenkosten', e.target.value)}
                        placeholder="200.00"
                      />
                    </div>
                    <div>
                      <Label>Verfügbar ab</Label>
                      <Input
                        type="date"
                        value={formData.verfuegbar_ab}
                        onChange={(e) => updateFormData('', 'verfuegbar_ab', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>
            )}

            {/* Schritt 3: Einstellungen */}
            {currentStep === 3 && (
              <FormSection title="Schritt 3 von 4: Datenschutz & Einstellungen">
                <div className="space-y-6">
                  <div>
                    <Label>Name des Formulars *</Label>
                    <Input
                      value={formData.form_name}
                      onChange={(e) => updateFormData('', 'form_name', e.target.value)}
                      placeholder="z.B. Bewerbung Musterstraße 10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Gültigkeit (Tage)</Label>
                      <Input
                        type="number"
                        value={formData.gueltigkeit_tage}
                        onChange={(e) => updateFormData('', 'gueltigkeit_tage', e.target.value)}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Max. Einsendungen</Label>
                      <Input
                        type="number"
                        value={formData.max_submissions}
                        onChange={(e) => updateFormData('', 'max_submissions', e.target.value)}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Aufbewahrung (Monate)</Label>
                      <Input
                        type="number"
                        value={formData.aufbewahrungsfrist_monate}
                        onChange={(e) => updateFormData('', 'aufbewahrungsfrist_monate', e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                    <Checkbox
                      checked={formData.weitere_kontakte_erlauben}
                      onCheckedChange={(checked) => updateFormData('', 'weitere_kontakte_erlauben', checked)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        Kontaktaufnahme für andere Objekte erlauben
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Mieter kann optional zustimmen, von Ihnen für andere Immobilien kontaktiert zu werden
                      </p>
                    </div>
                  </label>

                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm text-blue-800">
                      <strong>DSGVO-Hinweis:</strong> Das Formular enthält automatisch eine DSGVO-konforme Einwilligung. 
                      Der Mieter muss der Datenverarbeitung zustimmen.
                    </p>
                  </div>
                </div>
              </FormSection>
            )}

            {/* Schritt 4: Fertigstellung */}
            {currentStep === 4 && (
              <FormSection title="Schritt 4 von 4: Formular erstellen">
                <div className="space-y-6">
                  {!formConfig ? (
                    <div className="text-center py-8">
                      <Button
                        onClick={createForm}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Erstelle Formular...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Mieterselbstauskunft erstellen
                          </>
                        )}
                      </Button>
                    </div>
                  ) : null}

                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Übersicht:</strong>
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                      <li>• Formular: {formData.form_name}</li>
                      <li>• Objekt: {formData.objekt_adresse}</li>
                      <li>• Gültigkeit: {formData.gueltigkeit_tage} Tage</li>
                      <li>• Max. Bewerbungen: {formData.max_submissions}</li>
                    </ul>
                  </div>
                </div>
              </FormSection>
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
                disabled={loading || currentStep === 4}
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
          </>
        ) : (
          <div className="space-y-8">
            {/* Formular erfolgreich erstellt */}
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-bold text-green-900">
                  Mieterselbstauskunft erfolgreich erstellt!
                </h2>
              </div>

              <div className="space-y-4">
                {/* Shareable Link */}
                <FormSection title="Online-Formular teilen" defaultOpen={true}>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Link zum Teilen:</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          readOnly
                          value={shareLink}
                          className="text-sm"
                        />
                        <Button
                          onClick={copyLink}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        onClick={() => sendLink('test@example.com')}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email senden
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        💬 WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        🔗 SMS
                      </Button>
                    </div>

                    <div className="bg-blue-50 rounded p-3 text-sm text-blue-800">
                      <strong>Gültig bis:</strong> {new Date(Date.now() + formData.gueltigkeit_tage * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </FormSection>

                {/* Eingegangene Bewerbungen */}
                <FormSection title="Eingegangene Bewerbungen" defaultOpen={true}>
                  <div className="space-y-3">
                    <Button
                      onClick={loadSubmissions}
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Lädt...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Bewerbungen laden ({submissions.length})
                        </>
                      )}
                    </Button>

                    {submissions.length > 0 && (
                      <div className="space-y-2">
                        {submissions.map((sub, idx) => (
                          <div key={idx} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold">{sub.name || 'Unbekannt'}</div>
                                <div className="text-sm text-gray-600">{sub.email}</div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(sub.submitted_at).toLocaleDateString('de-DE')}
                              </span>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" variant="outline">Ansehen</Button>
                              <Button size="sm" variant="outline">✓ Zusagen</Button>
                              <Button size="sm" variant="outline">✗ Ablehnen</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormSection>

                {/* PDF exportieren */}
                <FormSection title="Formular als PDF">
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF zum Ausdrucken herunterladen
                  </Button>
                </FormSection>
              </div>
            </div>

            {/* Neue Kampagne */}
            <Button
              onClick={() => {
                setFormConfig(null);
                setCurrentStep(1);
                setShareLink(null);
                setFormData({
                  abgefragte_felder: {
                    name: true,
                    geburtsdatum: true,
                    telefon: true,
                    email: true,
                    beruf: false,
                    arbeitgeber: false,
                    nettoeinkommen: false,
                    einkommen_nachweis: false,
                    vermieter_name: false,
                    vermieter_kontakt: false,
                    umzugsgrund: false,
                    einzugstermin: false,
                    personenzahl: false,
                    mietschulden: false,
                    schufa_upload: false,
                    haustiere: false,
                    raucher: false,
                    fahrzeuge: false
                  },
                  objekt_adresse: '',
                  objekt_etage: '',
                  wohnflaeche: '',
                  zimmer: '',
                  kaltmiete: '',
                  nebenkosten: '',
                  verfuegbar_ab: '',
                  aufbewahrungsfrist_monate: 6,
                  max_submissions: 10,
                  gueltigkeit_tage: 14,
                  datenschutz_text_custom: '',
                  weitere_kontakte_erlauben: false,
                  form_name: ''
                });
              }}
              variant="outline"
              className="w-full"
            >
              Neue Mieterselbstauskunft erstellen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}