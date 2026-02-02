import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Calculator, Save } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function NettoanfangsrenditeRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    kaufpreis: '',
    jaehrliche_miete: '',
    leerstandsquote_prozent: '5',
    verwaltungskosten_prozent: '8',
    instandhaltung_prozent: '1',
    versicherung_jaehrlich: '0',
    grundsteuer_jaehrlich: '0',
    nebenkosten_umlage: '0'
  });

  const [result, setResult] = useState(null);

  React.useEffect(() => {
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

  const updateInput = (field, value) => {
    setInput(prev => ({ ...prev, [field]: value }));
    setResult(null);
  };

  const calculate = () => {
    const kaufpreis = parseFloat(input.kaufpreis);
    const mietjahr = parseFloat(input.jaehrliche_miete);
    const leerstand = parseFloat(input.leerstandsquote_prozent) / 100;
    const verwaltung = parseFloat(input.verwaltungskosten_prozent) / 100;
    const instandh = parseFloat(input.instandhaltung_prozent) / 100;
    const versicherung = parseFloat(input.versicherung_jaehrlich) || 0;
    const grundsteuer = parseFloat(input.grundsteuer_jaehrlich) || 0;
    const nebenkosten = parseFloat(input.nebenkosten_umlage) || 0;

    if (!kaufpreis || !mietjahr) {
      toast.error('Kaufpreis und jährliche Miete erforderlich');
      return;
    }

    // Bruttomiete
    const bruttomiete = mietjahr * (1 - leerstand);

    // Kosten
    const verwaltung_kosten = bruttomiete * verwaltung;
    const instandh_kosten = kaufpreis * instandh;
    const gesamtkosten = verwaltung_kosten + instandh_kosten + versicherung + grundsteuer - nebenkosten;

    // Nettoertrag
    const nettoertrag = bruttomiete - gesamtkosten;

    // Renditen
    const nay = (nettoertrag / kaufpreis) * 100;
    const gay = (bruttomiete / kaufpreis) * 100;
    const kostenquote = (gesamtkosten / bruttomiete) * 100;

    // Cash-Flow
    const monatliches_brutto = bruttomiete / 12;
    const monatliche_kosten = gesamtkosten / 12;
    const monatlicher_nettoertrag = nettoertrag / 12;

    setResult({
      kaufpreis: kaufpreis.toFixed(2),
      jaehrliche_bruttomiete: bruttomiete.toFixed(2),
      leerstandsverlust: (mietjahr * leerstand).toFixed(2),
      verwaltung_kosten: verwaltung_kosten.toFixed(2),
      instandh_kosten: instandh_kosten.toFixed(2),
      versicherung,
      grundsteuer,
      nebenkosten_einsparung: nebenkosten.toFixed(2),
      gesamtkosten: gesamtkosten.toFixed(2),
      nettoertrag: nettoertrag.toFixed(2),
      nay: nay.toFixed(2),
      gay: gay.toFixed(2),
      kostenquote: kostenquote.toFixed(2),
      monatliches_brutto: monatliches_brutto.toFixed(2),
      monatliche_kosten: monatliche_kosten.toFixed(2),
      monatlicher_nettoertrag: monatlicher_nettoertrag.toFixed(2)
    });
  };

  const saveCalculation = async () => {
    if (!result) {
      toast.error('Bitte zuerst berechnen');
      return;
    }
    if (!savedName.trim()) {
      toast.error('Bitte einen Namen eingeben');
      return;
    }

    setSaveLoading(true);
    try {
      await base44.entities.SavedCalculation.create({
        user_email: user.email,
        tool_name: 'Nettoanfangsrendite',
        tool_id: 'nettoanfangsrendite_rechner',
        calculation_data: input,
        result_data: result,
        name: savedName,
        is_favorite: false
      });

      toast.success('Berechnung gespeichert!');
      setSavedName('');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Nettoanfangsrendite (NAY) Rechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie die reale Rendite unter Berücksichtigung aller Betriebskosten
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Immobilie & Miete" collapsible={false}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Kaufpreis (€) *</Label>
                    <Input
                      type="number"
                      value={input.kaufpreis}
                      onChange={(e) => updateInput('kaufpreis', e.target.value)}
                      placeholder="400000"
                    />
                  </div>
                  <div>
                    <Label>Jährliche Bruttomiete (€) *</Label>
                    <Input
                      type="number"
                      value={input.jaehrliche_miete}
                      onChange={(e) => updateInput('jaehrliche_miete', e.target.value)}
                      placeholder="12000"
                    />
                  </div>
                </div>

                <div>
                  <Label>Leerstandsquote (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={input.leerstandsquote_prozent}
                    onChange={(e) => updateInput('leerstandsquote_prozent', e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Prozentsatz der Zeit, in der die Immobilie leer steht
                  </p>
                </div>
              </div>
            </FormSection>

            <FormSection title="Betriebskosten" collapsible={false} className="mt-4">
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-3">In % der Bruttomiete</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Verwaltungskosten (%)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={input.verwaltungskosten_prozent}
                        onChange={(e) => updateInput('verwaltungskosten_prozent', e.target.value)}
                        placeholder="8"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Instandhaltung (% des Kaufpreises)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={input.instandhaltung_prozent}
                        onChange={(e) => updateInput('instandhaltung_prozent', e.target.value)}
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Faustregel: 0,5-1,5% für ältere Immobilien
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-3">Fixkosten (€/Jahr)</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Versicherung (€/Jahr)</Label>
                      <Input
                        type="number"
                        value={input.versicherung_jaehrlich}
                        onChange={(e) => updateInput('versicherung_jaehrlich', e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Grundsteuer (€/Jahr)</Label>
                      <Input
                        type="number"
                        value={input.grundsteuer_jaehrlich}
                        onChange={(e) => updateInput('grundsteuer_jaehrlich', e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Nebenkosten-Umlage (€/Jahr) *</Label>
                      <Input
                        type="number"
                        value={input.nebenkosten_umlage}
                        onChange={(e) => updateInput('nebenkosten_umlage', e.target.value)}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Der Mieter zahlt das - zieht von Kosten ab
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={calculate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Berechnen
                </Button>
              </div>
            </FormSection>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-blue-200 bg-blue-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Renditen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-white rounded p-3 border border-green-300">
                      <p className="text-xs text-gray-600 mb-1">Nettoanfangsrendite (NAY)</p>
                      <p className="text-2xl font-bold text-green-600">
                        {result.nay}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Nach Betriebskosten</p>
                    </div>

                    <div className="bg-white rounded p-3 border border-blue-300">
                      <p className="text-xs text-gray-600 mb-1">Brutto-Anfangsrendite (GAY)</p>
                      <p className="text-lg font-bold text-blue-600">
                        {result.gay}%
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-orange-300">
                      <p className="text-xs text-gray-600 mb-1">Kostenquote</p>
                      <p className="text-lg font-bold text-orange-600">
                        {result.kostenquote}%
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Jährlicher Nettoertrag</p>
                      <p className="text-lg font-bold text-gray-900">
                        {parseFloat(result.nettoertrag).toLocaleString('de-DE')}€
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-cyan-200 bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Monatliche Übersicht</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between pb-2 border-b">
                      <span>Bruttomiete</span>
                      <span className="font-bold text-green-600">+{parseFloat(result.monatliches_brutto).toLocaleString('de-DE')}€</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span>Betriebskosten</span>
                      <span className="font-bold text-red-600">-{parseFloat(result.monatliche_kosten).toLocaleString('de-DE')}€</span>
                    </div>
                    <div className="flex justify-between font-bold text-green-600 bg-green-100 rounded p-2 mt-2">
                      <span>Nettoertrag</span>
                      <span>{parseFloat(result.monatlicher_nettoertrag).toLocaleString('de-DE')}€</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200 mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Kostenaufschlüsselung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Verwaltung</span>
                      <span className="font-bold">{parseFloat(result.verwaltung_kosten).toLocaleString('de-DE')}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instandhaltung</span>
                      <span className="font-bold">{parseFloat(result.instandh_kosten).toLocaleString('de-DE')}€</span>
                    </div>
                    {parseFloat(result.versicherung) > 0 && (
                      <div className="flex justify-between">
                        <span>Versicherung</span>
                        <span className="font-bold">{parseFloat(result.versicherung).toLocaleString('de-DE')}€</span>
                      </div>
                    )}
                    {parseFloat(result.grundsteuer) > 0 && (
                      <div className="flex justify-between">
                        <span>Grundsteuer</span>
                        <span className="font-bold">{parseFloat(result.grundsteuer).toLocaleString('de-DE')}€</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="mt-4 space-y-2">
                  <Input
                    placeholder="Berechnung benennen..."
                    value={savedName}
                    onChange={(e) => setSavedName(e.target.value)}
                  />
                  <Button
                    onClick={saveCalculation}
                    disabled={saveLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}