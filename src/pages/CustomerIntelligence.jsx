import React, { useState, useEffect } from 'react';
import { Brain, PlayCircle, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CustomerIntelligence() {
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadBehaviors();
  }, []);

  const loadBehaviors = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.CustomerBehavior.filter(
        {},
        '-churn_prediction_score',
        100
      );

      setBehaviors(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      await base44.functions.invoke('analyzeCustomerBehavior', {});
      toast.success('Analyse abgeschlossen');
      loadBehaviors();
    } catch (err) {
      toast.error('Fehler bei der Analyse');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const atRiskCount = behaviors.filter(b => b.churn_prediction_score > 70).length;
  const highEngagementCount = behaviors.filter(b => b.behavioral_cohort === 'high_engagement').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="w-8 h-8" />
          Customer Intelligence
        </h1>
        <Button onClick={handleAnalyze} className="bg-blue-600 hover:bg-blue-700">
          <PlayCircle className="w-4 h-4 mr-2" />
          Analyse starten
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Gesamtkunden</p>
          <p className="text-3xl font-bold text-blue-600">{behaviors.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Gefährdet</p>
          <p className="text-3xl font-bold text-red-600">{atRiskCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Highly Engaged</p>
          <p className="text-3xl font-bold text-green-600">{highEngagementCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Durchschn. NPS</p>
          <p className="text-3xl font-bold text-purple-600">
            {Math.round(behaviors.reduce((sum, b) => sum + (b.nps_score || 0), 0) / Math.max(1, behaviors.length))}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cohort</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Churn Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Expansion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">NPS</th>
            </tr>
          </thead>
          <tbody>
            {behaviors.slice(0, 20).map(behavior => (
              <tr key={behavior.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">{behavior.user_email}</td>
                <td className="px-6 py-3 text-sm capitalize text-gray-700">
                  {behavior.behavioral_cohort.replace('_', ' ')}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">{behavior.churn_prediction_score.toFixed(0)}%</div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          behavior.churn_prediction_score > 70 ? 'bg-red-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${behavior.churn_prediction_score}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  {behavior.expansion_likelihood.toFixed(0)}%
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">{behavior.nps_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}