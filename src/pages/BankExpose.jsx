import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, TrendingUp, DollarSign } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import ProgressSteps from '../components/wizard/ProgressSteps';
import FormSection from '../components/wizard/FormSection';

export default function BankExpose() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [rendite, setRendite] = useState(null);

  const [formData, setFormData] = useState({
    // Schritt 1: Typ
    expose_typ: 'neufinanzierung', // neufinanzierung, anschluss, nachfinanzierung, portfolio

    // Schritt 2: Objekt
    adresse: '',
    objektart: 'etw',
    baujahr: '',
    wohnflaeche: '',
    zimmer: '',
    kaufpreis: '',
    nebenkosten_prozent: 14,
    kaltmiete: '',
    nebenkosten_mtl: '',

    // Schritt 3: Finanzierung
    eigenkapital: '',
    zinsbindung: 15,
    anfangstilgung: 2,
    sollzins: 3.5,

    // Schritt 4: Vermögen (optional)
    gesamtvermoegen: '',
    bestehende_kredite: ''
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

  const calculateRendite = () => {
    const kaufpreis = parseFloat(formData.kaufpreis) || 0;
    const nebenkosten = (kaufpreis * parseFloat(formData.nebenkosten_prozent)) / 100;
    const gesamtinvestition = kaufpreis + nebenkosten;
    
    const kaltmiete = parseFloat(formData.kaltmiete) || 0;
    const nebenkosten_mtl = parseFloat(formData.nebenkosten_mtl) || 0;
    const bruttorendite_prozent = ((kaltmiete * 12) / gesamtinvestition) * 100;

    const eigenkapital = parseFloat(formData.eigenkapital) || 0;
    const darlehen = gesamtinvestition - eigenkapital;
    const darlehenszins = (darlehen * parseFloat(formData.sollzins)) / 100 / 12;
    
    const nettomiete = kaltmiete + nebenkosten_mtl - darlehenszins;
    const nettorendite_prozent = ((nettomiete * 12) / eigenkapital) * 100;

    const faktor = gesamtinvestition / (kaltmiete * 12);

    setRendite({
      gesamtinvestition,
      nebenkosten,
      bruttorendite_prozent,
      nettorendite_prozent,
      faktor,
      eigenkapital,
      darlehen,
      darlehenszins,
      monatlicher_cashflow: nettomiete
    });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Info only
    }
    if (currentStep === 2) {
      if (!formData.adresse || !formData.kaufpreis || !formData.kaltmiete) {
        toast.error('Bitte Adresse, Kaufpreis und Miete angeben');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.eigenkapital) {
        toast.error('Bitte Eigenkapital angeben');
        return;
      }
      calculateRendite();
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
        template_id: 'bank_expose',
        data: {
          expose_typ: formData.expose_typ,
          objekt: {
            adresse: formData.adresse,
            art: formData.objektart,
            baujahr: formData.baujahr,
            wohnflaeche: formData.wohnflaeche,
            zimmer: formData.zimmer,
            kaufpreis: formData.kaufpreis,
            kaltmiete: formData.kaltmiete,
            nebenkosten: formData.nebenkosten_mtl
          },
          finanzierung: {
            eigenkapital: formData.eigenkapital,
            darlehen: rendite.darlehen,
            zinssatz: formData.sollzins,
            zinsbindung: formData.zinsbindung,
            tilgung: formData.anfangstilgung
          },
          rendite: rendite,
          vermoegen: formData.gesamtvermoegen ? {
            gesamt: formData.gesamtvermoegen,
            kredite: formData.bestehende_kredite
          } : null,
          nutzer: user?.full_name
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Bank-Exposé erstellt!');
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

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏦 Bank-Exposé
          </h1>
          <p className="text-gray-600">
            Professionelle Finanzierungsunterlagen für die Bank
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={4} steps={['Typ', 'Objekt', 'Finanzierung', 'Export']} />

        {/* Schritt 1: Typ */}
        {currentStep === 1 && (
          <FormSection title="Schritt 1 von 4: Art des Exposés">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                <input
                  type="radio"
                  name="expose_typ"
                  value="neufinanzierung"
                  checked={formData.expose_typ === 'neufinanzierung'}
                  onChange={(e) => updateFormData('expose_typ', e.target.value)}
                />
                <div>
                  <div className="font-semibold">Neufinanzierung (Kauf)</div>
                  <p className="text-sm text-gray-600">Kaufpreisanalyse, Renditeberechnung</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                <input
                  type="radio"
                  name="expose_typ"
                  value="anschluss"
                  checked={formData.expose_typ === 'anschluss'}
                  onChange={(e) => updateFormData('expose_typ', e.target.value)}
                />
                <div>
                  <div className="font-semibold">Anschlussfinanzierung</div>
                  <p className="text-sm text-gray-600">Neue Konditionen, Tilgungsstand</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                <input
                  type="radio"
                  name="expose_typ"
                  value="nachfinanzierung"
                  checked={formData.expose_typ === 'nachfinanzierung'}
                  onChange={(e) => updateFormData('expose_typ', e.target.value)}
                />
                <div>
                  <div className="font-semibold">Nachfinanzierung (Sanierung)</div>
                  <p className="text-sm text-gray-600">Wertsteigerung, neue Mietpotenziale</p>
                </div>
              </label>
            </div>
          </FormSection>
        )}

        {/* Schritt 2: Objekt */}
        {currentStep === 2 && (
          <FormSection title="Schritt 2 von 4: Objektdaten">
            <div className="space-y-4">
              <div>
                <Label>Adresse *</Label>
                <Input
                  value={formData.adresse}
                  onChange={(e) => updateFormData('adresse', e.target.value)}
                  placeholder="Musterstraße 10, 12345 Berlin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Objektart</Label>
                  <select
                    value={formData.objektart}
                    onChange={(e) => updateFormData('objektart', e.target.value)}
                    className="w-full rounded border p-2"
                  >
                    <option value="etw">Eigentumswohnung</option>
                    <option value="einfamilienhaus">Einfamilienhaus</option>
                    <option value="mehrfamilienhaus">Mehrfamilienhaus</option>
                  </select>
                </div>
                <div>
                  <Label>Baujahr</Label>
                  <Input
                    type="number"
                    value={formData.baujahr}
                    onChange={(e) => updateFormData('baujahr', e.target.value)}
                    placeholder="1985"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Wohnfläche (m²)</Label>
                  <Input
                    type="number"
                    value={formData.wohnflaeche}
                    onChange={(e) => updateFormData('wohnflaeche', e.target.value)}
                    placeholder="75"
                  />
                </div>
                <div>
                  <Label>Zimmer</Label>
                  <Input
                    type="number"
                    value={formData.zimmer}
                    onChange={(e) => updateFormData('zimmer', e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label>Nebenkosten (%)</Label>
                  <Input
                    type="number"
                    value={formData.nebenkosten_prozent}
                    onChange={(e) => updateFormData('nebenkosten_prozent', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kaufpreis (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.kaufpreis}
                    onChange={(e) => updateFormData('kaufpreis', e.target.value)}
                    placeholder="250000"
                  />
                </div>
                <div>
                  <Label>Nebenkosten (€/Monat)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.nebenkosten_mtl}
                    onChange={(e) => updateFormData('nebenkosten_mtl', e.target.value)}
                    placeholder="200"
                  />
                </div>
              </div>

              <div>
                <Label>Kaltmiete (€/Monat) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.kaltmiete}
                  onChange={(e) => updateFormData('kaltmiete', e.target.value)}
                  placeholder="1050"
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Schritt 3: Finanzierung */}
        {currentStep === 3 && (
          <FormSection title="Schritt 3 von 4: Finanzierungswunsch">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Eigenkapital (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.eigenkapital}
                    onChange={(e) => updateFormData('eigenkapital', e.target.value)}
                    placeholder="60000"
                  />
                </div>
                <div>
                  <Label>Sollzins (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sollzins}
                    onChange={(e) => updateFormData('sollzins', e.target.value)}
                    placeholder="3.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Zinsbindung (Jahre)</Label>
                  <Input
                    type="number"
                    value={formData.zinsbindung}
                    onChange={(e) => updateFormData('zinsbindung', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Anfangstilgung (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.anfangstilgung}
                    onChange={(e) => updateFormData('anfangstilgung', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vermögensübersicht (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.gesamtvermoegen}
                  onChange={(e) => updateFormData('gesamtvermoegen', e.target.value)}
                  placeholder="Gesamtvermögen in €"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.bestehende_kredite}
                  onChange={(e) => updateFormData('bestehende_kredite', e.target.value)}
                  placeholder="Bestehende Kredite in €"
                />
              </div>

              {rendite && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="font-bold text-lg text-green-900 mb-4">Rendite-Übersicht</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bruttorendite:</span>
                      <span className="font-bold">{rendite.bruttorendite_prozent.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Nettorendite:</span>
                      <span className="font-bold text-green-600">{rendite.nettorendite_prozent.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Kaufpreisfaktor:</span>
                      <span className="font-bold">{rendite.faktor.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-green-300">
                      <span className="text-gray-700">Monatlicher Cashflow:</span>
                      <span className="font-bold text-lg">{rendite.monatlicher_cashflow.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Schritt 4: Export */}
        {currentStep === 4 && (
          <FormSection title="Schritt 4 von 4: Export">
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
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Bank-Exposé erstellen
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">✓ Bank-Exposé erstellt!</p>
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
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {currentStep === 4 ? 'Fertig' : 'Weiter →'}
          </Button>
        </div>
      </div>
    </div>
  );
}