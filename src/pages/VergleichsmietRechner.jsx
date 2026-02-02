import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Calculator, Save, Plus, Trash2 } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function VergleichsmietRechner() {
  const [user, setUser] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedName, setSavedName] = React.useState('');

  const [input, setInput] = useState({
    objektadresse: '',
    wohnflaeche: '',
    baujahr: '',
    ausstattung: 'standard', // einfach, standard, gehoben, luxus
    lage: 'mittelmaeßig', // zentral, gut, mittelmaeßig, schlecht
    vergleichsobjekte: []
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

  const addComparison = () => {
    setInput(prev => ({
      ...prev,
      vergleichsobjekte: [...prev.vergleichsobjekte, { 
        adresse: '', 
        miete: '', 
        wohnflaeche: '', 
        baujahr: '' 
      }]
    }));
  };

  const removeComparison = (idx) => {
    setInput(prev => ({
      ...prev,
      vergleichsobjekte: prev.vergleichsobjekte.filter((_, i) => i !== idx)
    }));
  };

  const updateComparison = (idx, field, value) => {
    setInput(prev => ({
      ...prev,
      vergleichsobjekte: prev.vergleichsobjekte.map((obj, i) =>
        i === idx ? { ...obj, [field]: value } : obj
      )
    }));
  };

  const calculate = () => {
    if (!input.wohnflaeche) {
      toast.error('Wohnfläche erforderlich');
      return;
    }

    if (input.vergleichsobjekte.length === 0) {
      toast.error('Mindestens 1 Vergleichsobjekt erforderlich');
      return;
    }

    const valid_vergleiche = input.vergleichsobjekte.filter(v => 
      v.miete && v.wohnflaeche
    );

    if (valid_vergleiche.length === 0) {
      toast.error('Vergleichsobjekte mit Miete und Wohnfläche erforderlich');
      return;
    }

    // Berechne durchschnittliche Miete pro m²
    const mieten_pro_m2 = valid_vergleiche.map(v => 
      parseFloat(v.miete) / parseFloat(v.wohnflaeche)
    );

    const avg_miete_m2 = mieten_pro_m2.reduce((a, b) => a + b, 0) / mieten_pro_m2.length;
    const min_miete_m2 = Math.min(...mieten_pro_m2);
    const max_miete_m2 = Math.max(...mieten_pro_m2);

    // Berechne angepasste Miete für Zielobjekt
    const wohnflaeche = parseFloat(input.wohnflaeche);
    let adjusted_avg = avg_miete_m2;

    // Anpassung basierend auf Ausstattung
    const ausstattungs_faktoren = {
      'einfach': 0.85,
      'standard': 1.0,
      'gehoben': 1.15,
      'luxus': 1.30
    };
    adjusted_avg *= ausstattungs_faktoren[input.ausstattung];

    // Anpassung basierend auf Lage
    const lage_faktoren = {
      'zentral': 1.20,
      'gut': 1.10,
      'mittelmaeßig': 1.0,
      'schlecht': 0.85
    };
    adjusted_avg *= lage_faktoren[input.lage];

    const angemessene_miete = adjusted_avg * wohnflaeche;
    const min_miete = min_miete_m2 * wohnflaeche;
    const max_miete = max_miete_m2 * wohnflaeche;

    setResult({
      avg_miete_m2: avg_miete_m2.toFixed(2),
      min_miete_m2: min_miete_m2.toFixed(2),
      max_miete_m2: max_miete_m2.toFixed(2),
      angemessene_miete: angemessene_miete.toFixed(2),
      min_miete: min_miete.toFixed(2),
      max_miete: max_miete.toFixed(2),
      vergleiche_count: valid_vergleiche.length
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
        tool_name: 'Vergleichsmietrechner',
        tool_id: 'vergleichsmiet_rechner',
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
            🏘️ Vergleichsmietrechner
          </h1>
          <p className="text-gray-600">
            Ermitteln Sie die ortsübliche Vergleichsmiete basierend auf ähnlichen Objekten
          </p>
        </div>

        <FormSection title="Zielobjekt" collapsible={false}>
          <div className="space-y-4">
            <div>
              <Label>Objektadresse</Label>
              <Input
                value={input.objektadresse}
                onChange={(e) => updateInput('objektadresse', e.target.value)}
                placeholder="Musterstraße 10, 12345 Berlin"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Wohnfläche (m²) *</Label>
                <Input
                  type="number"
                  value={input.wohnflaeche}
                  onChange={(e) => updateInput('wohnflaeche', e.target.value)}
                  placeholder="75"
                />
              </div>
              <div>
                <Label>Baujahr</Label>
                <Input
                  type="number"
                  value={input.baujahr}
                  onChange={(e) => updateInput('baujahr', e.target.value)}
                  placeholder="1995"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ausstattung</Label>
                <select
                  value={input.ausstattung}
                  onChange={(e) => updateInput('ausstattung', e.target.value)}
                  className="w-full rounded border p-2"
                >
                  <option value="einfach">Einfach</option>
                  <option value="standard">Standard</option>
                  <option value="gehoben">Gehoben</option>
                  <option value="luxus">Luxus</option>
                </select>
              </div>
              <div>
                <Label>Lage</Label>
                <select
                  value={input.lage}
                  onChange={(e) => updateInput('lage', e.target.value)}
                  className="w-full rounded border p-2"
                >
                  <option value="zentral">Zentral</option>
                  <option value="gut">Gut</option>
                  <option value="mittelmaeßig">Mittelmäßig</option>
                  <option value="schlecht">Schlecht</option>
                </select>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Vergleichsobjekte" collapsible={false} className="mt-6">
          <div className="space-y-4">
            {input.vergleichsobjekte.map((obj, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm">Objekt {idx + 1}</span>
                  <Button
                    onClick={() => removeComparison(idx)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Adresse</Label>
                  <Input
                    value={obj.adresse}
                    onChange={(e) => updateComparison(idx, 'adresse', e.target.value)}
                    placeholder="Vergleichsstraße 5"
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Miete (€)</Label>
                    <Input
                      type="number"
                      value={obj.miete}
                      onChange={(e) => updateComparison(idx, 'miete', e.target.value)}
                      placeholder="900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">m²</Label>
                    <Input
                      type="number"
                      value={obj.wohnflaeche}
                      onChange={(e) => updateComparison(idx, 'wohnflaeche', e.target.value)}
                      placeholder="85"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Baujahr</Label>
                    <Input
                      type="number"
                      value={obj.baujahr}
                      onChange={(e) => updateComparison(idx, 'baujahr', e.target.value)}
                      placeholder="2000"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              onClick={addComparison}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Vergleichsobjekt hinzufügen
            </Button>
          </div>
        </FormSection>

        <Button
          onClick={calculate}
          className="w-full bg-indigo-600 hover:bg-indigo-700 mt-6"
          size="lg"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Vergleichsmiete berechnen
        </Button>

        {result && (
          <>
            <Card className="border-2 border-orange-200 bg-orange-50 mt-6">
              <CardHeader>
                <CardTitle>Vergleichsmietanalyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Durchschnittliche Miete/m²</p>
                    <p className="text-xl font-bold text-gray-900">
                      {result.avg_miete_m2}€/m²
                    </p>
                  </div>

                  <div className="bg-white rounded p-3 border border-orange-300">
                    <p className="text-xs text-gray-600 mb-1">Angemessene Monatsmiete</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {parseFloat(result.angemessene_miete).toLocaleString('de-DE')}€
                    </p>
                  </div>

                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Mietspanne (Min/Max)</p>
                    <p className="text-sm">
                      {parseFloat(result.min_miete).toLocaleString('de-DE')}€ – {parseFloat(result.max_miete).toLocaleString('de-DE')}€
                    </p>
                  </div>

                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Vergleichsobjekte</p>
                    <p className="text-lg font-bold">{result.vergleiche_count}</p>
                  </div>
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
  );
}