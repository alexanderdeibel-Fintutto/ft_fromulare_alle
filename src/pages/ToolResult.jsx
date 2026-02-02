import React, { useState, useEffect } from 'react';
import { Download, Share2, MoreVertical } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import AppHeader from '../components/layout/AppHeader';
import { Loader } from 'lucide-react';

export default function ToolResult() {
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const calculationId = urlParams.get('id');

  useEffect(() => {
    loadCalculation();
  }, [calculationId]);

  const loadCalculation = async () => {
    setLoading(true);
    try {
      if (calculationId) {
        const calc = await base44.entities.SavedCalculation.get(calculationId);
        setCalculation(calc);
      }
    } catch (err) {
      console.error('Load calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Berechnung nicht gefunden</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {calculation.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {calculation.tool_name}
              </p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Input Values */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Eingabeparameter
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(calculation.calculation_data || {}).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ergebnisse
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(calculation.result_data || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                >
                  <p className="text-xs font-medium text-gray-600 capitalize mb-2">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number'
                      ? value.toFixed(2) + (key.includes('rendite') ? '%' : '')
                      : value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Als PDF exportieren
            </Button>
            <Button
              variant="outline"
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Teilen
            </Button>
          </div>
        </div>

        {/* Meta Info */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>
            Erstellt: {new Date(calculation.created_date).toLocaleDateString('de-DE')}
          </p>
          {calculation.description && (
            <p className="mt-2">{calculation.description}</p>
          )}
        </div>
      </main>
    </div>
  );
}