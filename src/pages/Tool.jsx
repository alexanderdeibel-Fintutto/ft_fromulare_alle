import React, { useState, useEffect } from 'react';
import { Save, Copy, Share2, RotateCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppHeader from '../components/layout/AppHeader';

export default function Tool() {
  const [tool, setTool] = useState(null);
  const [formData, setFormData] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculationName, setCalculationName] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const toolId = urlParams.get('id') || 'renditerechner';

  useEffect(() => {
    loadTool();
  }, [toolId]);

  const loadTool = () => {
    // Load tool configuration
    const tools = {
      renditerechner: {
        id: 'renditerechner',
        name: 'Renditerechner',
        description: 'Berechnen Sie die Brutto- und Nettorendite Ihrer Immobilie',
        inputs: [
          { id: 'kaufpreis', label: 'Kaufpreis (€)', type: 'number' },
          { id: 'jaehrliches_einkommen', label: 'Jährliches Mieteinnahmen (€)', type: 'number' },
          { id: 'jaehrliche_kosten', label: 'Jährliche Kosten (€)', type: 'number' }
        ]
      }
    };

    setTool(tools[toolId] || tools.renditerechner);
  };

  const handleInputChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: parseFloat(value) || 0 });
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Calculate based on tool type
      const result = calculateRendite(formData);
      setResults(result);

      // Track analytics
      try {
        await base44.functions.invoke('trackAnalytics', {
          eventType: 'tool_used',
          metadata: { tool_id: toolId }
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateRendite = (data) => {
    const { kaufpreis, jaehrliches_einkommen, jaehrliche_kosten } = data;
    const nettoEinkommen = jaehrliches_einkommen - jaehrliche_kosten;
    const bruttoRendite = (jaehrliches_einkommen / kaufpreis) * 100;
    const nettoRendite = (nettoEinkommen / kaufpreis) * 100;

    return {
      kaufpreis: kaufpreis.toFixed(2),
      jaehrliches_einkommen: jaehrliches_einkommen.toFixed(2),
      jaehrliche_kosten: jaehrliche_kosten.toFixed(2),
      brutto_rendite: bruttoRendite.toFixed(2),
      netto_rendite: nettoRendite.toFixed(2),
      netto_einkommen: nettoEinkommen.toFixed(2)
    };
  };

  const handleSaveCalculation = async () => {
    if (!calculationName.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    setSaving(true);
    try {
      await base44.functions.invoke('saveCalculation', {
        toolName: tool.name,
        toolId: tool.id,
        calculationData: formData,
        resultData: results,
        name: calculationName
      });
      toast.success('Berechnung gespeichert!');
      setCalculationName('');
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({});
    setResults(null);
    setCalculationName('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {tool?.name}
              </h2>
              <p className="text-sm text-gray-600 mb-6">{tool?.description}</p>

              <div className="space-y-4 mb-6">
                {tool?.inputs?.map(input => (
                  <div key={input.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {input.label}
                    </label>
                    <input
                      type={input.type}
                      value={formData[input.id] || ''}
                      onChange={(e) => handleInputChange(input.id, e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Berechnen
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="icon"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {results ? (
              <>
                <div className="bg-white rounded-lg border p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Ergebnisse
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(results).map(([key, value]) => {
                      const labels = {
                        brutto_rendite: 'Brutto Rendite',
                        netto_rendite: 'Netto Rendite',
                        netto_einkommen: 'Netto Einkommen',
                        jaehrliche_kosten: 'Jährliche Kosten',
                        jaehrliches_einkommen: 'Jährliche Einnahmen',
                        kaufpreis: 'Kaufpreis'
                      };

                      return (
                        <div key={key} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            {labels[key] || key}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {(key.includes('rendite') ? value + '%' : '€ ' + value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Calculation */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Berechnung speichern
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={calculationName}
                      onChange={(e) => setCalculationName(e.target.value)}
                      placeholder="Name für diese Berechnung..."
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveCalculation}
                        disabled={saving || !calculationName.trim()}
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        Speichern
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg border p-8 text-center">
                <p className="text-gray-600">
                  Füllen Sie die Felder aus und klicken Sie auf "Berechnen"
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}