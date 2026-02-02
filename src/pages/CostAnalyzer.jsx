import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function CostAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('analyzeCostOptimization', {});
      setAnalysis(result.data);
      toast.success('Analyse abgeschlossen');
    } catch (error) {
      toast.error('Fehler bei der Analyse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Cost Analyzer</h1>

      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Kostenanalyse
            </h2>
            <p className="text-sm text-gray-600 mt-1">Optimiere deine Cloud-Ausgaben</p>
          </div>
          <Button onClick={handleAnalyze} disabled={loading} className="gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Analysieren
          </Button>
        </div>
      </Card>

      {analysis && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Kosten Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-sm text-blue-600">Storage</p>
                <p className="text-2xl font-bold text-blue-900">€450</p>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <p className="text-sm text-green-600">Compute</p>
                <p className="text-2xl font-bold text-green-900">€650</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Empfehlungen
            </h3>
            <ul className="space-y-2">
              {analysis.recommendations?.map((rec, i) => (
                <li key={i} className="text-sm text-gray-700">✓ {rec}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}