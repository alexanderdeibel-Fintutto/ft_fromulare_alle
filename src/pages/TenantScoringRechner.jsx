import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Calculator, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function TenantScoringRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    einkommen_monatlich: '',
    miete_monatlich: '',
    ausgaben_monatlich: '0',
    schufa_score: '80',
    beschaeftigungsdauer_jahre: '2',
    arbeitsvertrag: 'unbefristet',
    vermieter_referenzen: '0',
    kaution_bereitschaft: 'ja',
    einkommen_stabilität: 'stabil'
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
    const einkommen = parseFloat(input.einkommen_monatlich);
    const miete = parseFloat(input.miete_monatlich);
    const ausgaben = parseFloat(input.ausgaben_monatlich) || 0;
    const schufa = parseFloat(input.schufa_score);
    const beschaeftigung = parseInt(input.beschaeftigungsdauer_jahre);

    if (!einkommen || !miete) {
      toast.error('Einkommen und Miete erforderlich');
      return;
    }

    let score = 0;
    const details = [];

    // 1. Mietquote (max 30%)
    const mietquote = (miete / einkommen) * 100;
    if (mietquote <= 25) {
      score += 25;
      details.push({ kriterium: 'Mietquote ≤ 25%', punkte: 25, status: 'optimal' });
    } else if (mietquote <= 30) {
      score += 15;
      details.push({ kriterium: 'Mietquote 25-30%', punkte: 15, status: 'gut' });
    } else {
      score += 5;
      details.push({ kriterium: 'Mietquote > 30%', punkte: 5, status: 'risiko' });
    }

    // 2. SCHUFA Score
    if (schufa >= 90) {
      score += 25;
      details.push({ kriterium: 'SCHUFA ≥ 90', punkte: 25, status: 'optimal' });
    } else if (schufa >= 75) {
      score += 15;
      details.push({ kriterium: 'SCHUFA 75-90', punkte: 15, status: 'gut' });
    } else {
      score += 5;
      details.push({ kriterium: 'SCHUFA < 75', punkte: 5, status: 'risiko' });
    }

    // 3. Beschäftigungsstabilität
    if (input.arbeitsvertrag === 'unbefristet') {
      if (beschaeftigung >= 2) {
        score += 20;
        details.push({ kriterium: 'Unbefristet ≥ 2a', punkte: 20, status: 'optimal' });
      } else {
        score += 10;
        details.push({ kriterium: 'Unbefristet < 2a', punkte: 10, status: 'gut' });
      }
    } else {
      score += 5;
      details.push({ kriterium: 'Befristeter Vertrag', punkte: 5, status: 'risiko' });
    }

    // 4. Vermieter-Referenzen
    const referenzen = parseInt(input.vermieter_referenzen);
    if (referenzen >= 2) {
      score += 15;
      details.push({ kriterium: '≥ 2 Referenzen', punkte: 15, status: 'optimal' });
    } else if (referenzen === 1) {
      score += 8;
      details.push({ kriterium: '1 Referenz', punkte: 8, status: 'gut' });
    } else {
      score += 3;
      details.push({ kriterium: 'Keine Referenzen', punkte: 3, status: 'risiko' });
    }

    // 5. Kaution
    if (input.kaution_bereitschaft === 'ja') {
      score += 10;
      details.push({ kriterium: 'Kaution bereit', punkte: 10, status: 'optimal' });
    } else {
      details.push({ kriterium: 'Keine Kaution', punkte: 0, status: 'risiko' });
    }

    // 6. Finanzielle Stabilität
    if (input.einkommen_stabilität === 'stabil') {
      score += 5;
      details.push({ kriterium: 'Stabiles Einkommen', punkte: 5, status: 'optimal' });
    } else {
      details.push({ kriterium: 'Variables Einkommen', punkte: 0, status: 'warnung' });
    }

    // Risikoklasse
    let risikoklasse = '';
    let farbe = '';
    if (score >= 85) {
      risikoklasse = 'Sehr gutes Risiko';
      farbe = 'text-green-600';
    } else if (score >= 70) {
      risikoklasse = 'Gutes Risiko';
      farbe = 'text-green-500';
    } else if (score >= 50) {
      risikoklasse = 'Moderates Risiko';
      farbe = 'text-amber-600';
    } else {
      risikoklasse = 'Erhöhtes Risiko';
      farbe = 'text-red-600';
    }

    // Cashflow-Analyse
    const cashflow_monatlich = einkommen - miete - ausgaben;
    const cashflow_puffer_monate = cashflow_monatlich > 0 ? (cashflow_monatlich / miete).toFixed(1) : 0;

    setResult({
      score,
      risikoklasse,
      farbe,
      mietquote: mietquote.toFixed(1),
      cashflow_monatlich: cashflow_monatlich.toFixed(2),
      cashflow_puffer_monate,
      details,
      empfehlung: score >= 70 ? 'Mieter kann empfohlen werden' : 'Erhöhte Vorsicht / Kaution empfohlen'
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
        tool_name: 'Tenant Scoring',
        tool_id: 'tenant_scoring_rechner',
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
            👤 Tenant Scoring & Bonitätsprüfung
          </h1>
          <p className="text-gray-600">
            Bewerten Sie Mieterbewerber systematisch anhand von Bonität & Zahlungsfähigkeit
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <FormSection title="Finanzielle Situation" collapsible={false}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Monatliches Einkommen (€) *</Label>
                    <Input
                      type="number"
                      value={input.einkommen_monatlich}
                      onChange={(e) => updateInput('einkommen_monatlich', e.target.value)}
                      placeholder="3000"
                    />
                  </div>
                  <div>
                    <Label>Gewünschte Miete (€) *</Label>
                    <Input
                      type="number"
                      value={input.miete_monatlich}
                      onChange={(e) => updateInput('miete_monatlich', e.target.value)}
                      placeholder="800"
                    />
                  </div>
                </div>

                <div>
                  <Label>Sonstige Ausgaben (€)</Label>
                  <Input
                    type="number"
                    value={input.ausgaben_monatlich}
                    onChange={(e) => updateInput('ausgaben_monatlich', e.target.value)}
                    placeholder="1500"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Bonität & Stabilität" collapsible={false} className="mt-4">
              <div className="space-y-6">
                <div>
                  <Label>SCHUFA Score (0-100)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={input.schufa_score}
                    onChange={(e) => updateInput('schufa_score', e.target.value)}
                    placeholder="80"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Arbeitsvertrag</Label>
                    <select
                      value={input.arbeitsvertrag}
                      onChange={(e) => updateInput('arbeitsvertrag', e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="unbefristet">Unbefristet</option>
                      <option value="befristet">Befristet</option>
                      <option value="selbststaendig">Selbstständig</option>
                    </select>
                  </div>
                  <div>
                    <Label>Beschäftigungsdauer (Jahre)</Label>
                    <Input
                      type="number"
                      value={input.beschaeftigungsdauer_jahre}
                      onChange={(e) => updateInput('beschaeftigungsdauer_jahre', e.target.value)}
                      placeholder="2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Vermieter-Referenzen (Anzahl)</Label>
                    <Input
                      type="number"
                      value={input.vermieter_referenzen}
                      onChange={(e) => updateInput('vermieter_referenzen', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Kaution bereit?</Label>
                    <select
                      value={input.kaution_bereitschaft}
                      onChange={(e) => updateInput('kaution_bereitschaft', e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="ja">Ja</option>
                      <option value="nein">Nein</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Einkommensstabilität</Label>
                  <select
                    value={input.einkommen_stabilität}
                    onChange={(e) => updateInput('einkommen_stabilität', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="stabil">Stabil (Festangestellte)</option>
                    <option value="variabel">Variabel (Provision, Stundenlohn)</option>
                    <option value="unsicher">Unsicher (Aushilfe, Befristet)</option>
                  </select>
                </div>
              </div>
            </FormSection>

            <Button
              onClick={calculate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Scoring berechnen
            </Button>
          </div>

          {/* Result Section */}
          <div>
            {result && (
              <>
                <Card className="border-2 border-blue-200 bg-blue-50 mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Bonitätsscore</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900 mb-2">{result.score}</div>
                      <p className={`text-lg font-bold ${result.farbe}`}>
                        {result.risikoklasse}
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Mietquote</p>
                      <p className="text-lg font-bold text-gray-900">
                        {result.mietquote}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.mietquote <= 30 ? '✓ OK' : '⚠ Zu hoch'}
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Monatlicher Puffer</p>
                      <p className="text-lg font-bold text-green-600">
                        {parseFloat(result.cashflow_monatlich).toLocaleString('de-DE')}€
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.cashflow_puffer_monate}x Miete
                      </p>
                    </div>

                    {result.score >= 70 ? (
                      <div className="bg-green-50 border border-green-300 rounded p-3 flex gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-green-800">{result.empfehlung}</p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-300 rounded p-3 flex gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-amber-800">{result.empfehlung}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Bewertungs-Kriterien</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {result.details.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-0">
                        <span className="text-gray-700">{d.kriterium}</span>
                        <span className="font-bold">{d.punkte}p</span>
                      </div>
                    ))}
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