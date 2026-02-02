import React, { useState, useEffect } from 'react';
import { TrendingUp, Heart, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CustomerSuccessDashboard() {
  const [healthScores, setHealthScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadHealthScores();
  }, []);

  const loadHealthScores = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.CustomerHealthScore.filter(
        {},
        '-health_score',
        100
      );

      setHealthScores(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateHealth = async () => {
    try {
      await base44.functions.invoke('calculateCustomerHealth', {});
      toast.success('Health Scores berechnet');
      loadHealthScores();
    } catch (err) {
      toast.error('Fehler bei der Berechnung');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const highRisk = healthScores.filter(s => s.health_score < 40).length;
  const atRisk = healthScores.filter(s => s.health_score >= 40 && s.health_score < 60).length;
  const healthy = healthScores.filter(s => s.health_score >= 60).length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="w-8 h-8" />
          Customer Success Dashboard
        </h1>
        <Button onClick={handleCalculateHealth} className="bg-blue-600 hover:bg-blue-700">
          <Zap className="w-4 h-4 mr-2" />
          Berechnen
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Gesamt Kunden</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{healthScores.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Gesund</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{healthy}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Gefährdet</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{atRisk}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Hohes Risiko</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{highRisk}</p>
        </div>
      </div>

      <div className="space-y-3">
        {healthScores.map(score => (
          <div key={score.id} className="bg-white rounded-lg border p-4 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-bold text-gray-900">{score.user_email}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {score.health_trend === 'improving' ? '📈' : 
                   score.health_trend === 'declining' ? '📉' : '→'} {score.health_trend}
                </p>
              </div>

              <div className="text-right space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        score.health_score >= 60 ? 'bg-green-500' :
                        score.health_score >= 40 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${score.health_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">
                    {score.health_score.toFixed(0)}
                  </span>
                </div>

                {score.expansion_opportunity && (
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold capitalize ${
                    score.expansion_opportunity === 'high' ? 'bg-green-100 text-green-800' :
                    score.expansion_opportunity === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {score.expansion_opportunity}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}