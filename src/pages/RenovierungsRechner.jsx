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

export default function RenovierungsRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    investition: '',
    mieterhohung_prozent: '',
    mieterhohung_monatlich: '',
    leerstandsreduzierung_tage: '0',
    erhaltungsaufwand_reduktion: '0',
    zeitraum_jahre: '10',
    diskontierungssatz: '5'
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
    const investition = parseFloat(input.investition);
    const mieterhohung_monatlich = parseFloat(input.mieterhohung_monatlich) || 0;
    const leerstandsreduktion = parseInt(input.leerstandsreduzierung_tage) || 0;
    const erhaltungsreduktion = parseFloat(input.erhaltungsaufwand_reduktion) || 0;
    const zeitraum = parseInt(input.zeitraum_jahre);
    const zins = parseFloat(input.diskontierungssatz) / 100;

    if (!investition || !zeitraum) {
      toast.error('Investition und Zeitraum erforderlich');
      return;
    }

    // Jährliche Nutzen
    const mieterhohung_jaehrlich = mieterhohung_monatlich * 12;
    const leerstandsvermeidung_jaehrlich = (leerstandsreduktion / 365) * (mieterhohung_monatlich * 12);
    const erhaltungseinsparung_jaehrlich = erhaltungsreduktion;
    const nutzen_jaehrlich = mieterhohung_jaehrlich + leerstandsvermeidung_jaehrlich + erhaltungseinsparung_jaehrlich;

    // NPV Berechnung
    let npv = -investition;
    let cashflows = [];
    for (let jahr = 1; jahr <= zeitraum; jahr++) {
      const pv = nutzen_jaehrlich / Math.pow(1 + zins, jahr);
      npv += pv;
      cashflows.push({
        jahr,
        cashflow: nutzen_jaehrlich.toFixed(2),
        diskontiert: pv.toFixed(2),
        kumulativ: (cashflows.reduce((s, cf) => s + parseFloat(cf.cashflow), 0) + nutzen_jaehrlich * jahr - investition).toFixed(2)
      });
    }

    // Payback Period
    let payback = null;
    let cumulative = -investition;
    for (let jahr = 1; jahr <= zeitraum; jahr++) {
      cumulative += nutzen_jaehrlich;
      if (cumulative >= 0 && payback === null) {
        payback = (jahr - 1 + Math.abs(cumulative - nutzen_jaehrlich) / nutzen_jaehrlich).toFixed(2);
      }
    }

    // ROI
    const gesamtertrag = nutzen_jaehrlich * zeitraum;
    const roi = ((gesamtertrag - investition) / investition) * 100;

    setResult({
      investition: investition.toFixed(2),
      nutzen_monatlich: nutzen_jaehrlich.toFixed(2) / 12,
      nutzen_jaehrlich: nutzen_jaehrlich.toFixed(2),
      npv: npv.toFixed(2),
      payback_period: payback,
      roi_prozent: roi.toFixed(2),
      gesamtertrag: gesamtertrag.toFixed(2),
      zeitraum,
      mieterhohung_anteil: mieterhohung_jaehrlich.toFixed(2),
      leerstandsvermeidung_anteil: leerstandsvermeidung_jaehrlich.toFixed(2),
      erhaltungssparen_anteil: erhaltungseinsparung_jaehrlich.toFixed(2)
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
        tool_name: 'Renovierungsrechner',
        tool_id: 'renovierungs_rechner',
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
            🔨 Renovierungsrechner
          </h1>
          <p className="text-gray-600">
            Berechnen Sie NPV und ROI von Renovierungsinvestitionen
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Investition & Nutzen" collapsible={false}>
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    <strong>Renovierungs-ROI:</strong> NPV und Amortisationsdauer berechnen
                  </p>
                </div>

                <div>
                  <Label>Investitionskosten (€) *</Label>
                  <Input
                    type="number"
                    value={input.investition}
                    onChange={(e) => updateInput('investition', e.target.value)}
                    placeholder="50000"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Jährliche Nutzen</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Mieterhöhung (monatlich, €)</Label>
                      <Input
                        type="number"
                        step="10"
                        value={input.mieterhohung_monatlich}
                        onChange={(e) => updateInput('mieterhohung_monatlich', e.target.value)}
                        placeholder="200"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Leerstandsreduzierung (Tage/Jahr)</Label>
                      <Input
                        type="number"
                        value={input.leerstandsreduzierung_tage}
                        onChange={(e) => updateInput('leerstandsreduzierung_tage', e.target.value)}
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Kürzere Vermietungszeit durch besseren Zustand
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm">Instandhaltungsersparnis (€/Jahr)</Label>
                      <Input
                        type="number"
                        value={input.erhaltungsaufwand_reduktion}
                        onChange={(e) => updateInput('erhaltungsaufwand_reduktion', e.target.value)}
                        placeholder="5000"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Betrachtungszeitraum (Jahre) *</Label>
                    <Input
                      type="number"
                      value={input.zeitraum_jahre}
                      onChange={(e) => updateInput('zeitraum_jahre', e.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label>Diskontierungssatz (%) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={input.diskontierungssatz}
                      onChange={(e) => updateInput('diskontierungssatz', e.target.value)}
                      placeholder="5"
                    />
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
                <Card className="border-2 border-orange-200 bg-orange-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Investitions-Analyse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-white rounded p-3 border border-green-300">
                      <p className="text-xs text-gray-600 mb-1">NPV ({result.zeitraum}a)</p>
                      <p className={`text-2xl font-bold ${parseFloat(result.npv) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(result.npv) >= 0 ? '+' : ''}{parseFloat(result.npv).toLocaleString('de-DE')}€
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-blue-300">
                      <p className="text-xs text-gray-600 mb-1">Payback-Period</p>
                      <p className="text-xl font-bold text-blue-600">
                        {result.payback_period ? `${result.payback_period} Jahre` : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-purple-300">
                      <p className="text-xs text-gray-600 mb-1">ROI ({result.zeitraum}a)</p>
                      <p className="text-xl font-bold text-purple-600">
                        {result.roi_prozent}%
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Jährlicher Nutzen</p>
                      <p className="text-lg font-bold text-gray-900">
                        {parseFloat(result.nutzen_jaehrlich).toLocaleString('de-DE')}€
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-cyan-200 bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Nutzen-Zusammensetzung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Mieterhöhung:</span>
                      <span className="font-bold">{parseFloat(result.mieterhohung_anteil).toLocaleString('de-DE')}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leerstandsreduktion:</span>
                      <span className="font-bold">{parseFloat(result.leerstandsvermeidung_anteil).toLocaleString('de-DE')}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instandhaltungssparen:</span>
                      <span className="font-bold">{parseFloat(result.erhaltungssparen_anteil).toLocaleString('de-DE')}€</span>
                    </div>
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