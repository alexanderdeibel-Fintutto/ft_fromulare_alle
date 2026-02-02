import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingDown, Zap, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CostOptimizationRecommendations({ isAdmin = false }) {
  const [recommendations, setRecommendations] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      const response = await base44.functions.invoke('generateAICostOptimizations');
      setRecommendations(response.data.recommendations || []);
      setAnalysis(response.data.analysis || {});
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Fehler beim Laden der Empfehlungen');
    } finally {
      setLoading(false);
    }
  }

  function dismissRecommation(id) {
    setDismissed(prev => new Set([...prev, id]));
  }

  function getPriorityColor(priority) {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[priority] || colors.low;
  }

  function getPriorityIcon(priority) {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-5 h-5" />;
      case 'medium':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  }

  const totalPotentialSavings = recommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0);
  const visibleRecommendations = recommendations.filter(r => !dismissed.has(r.id));

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Analysiere Nutzungsmuster...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {totalPotentialSavings > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900">Potenzielle Einsparungen</h3>
                <p className="text-sm text-green-800 mt-1">
                  €{totalPotentialSavings.toFixed(2)} möglich durch diese Optimierungen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <div className="space-y-3">
        {visibleRecommendations.length > 0 ? (
          visibleRecommendations.map(rec => (
            <Card key={rec.id} className="border-l-4" style={{
              borderLeftColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#3b82f6'
            }}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{rec.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority === 'high' ? '🔴 Hoch' : rec.priority === 'medium' ? '🟡 Mittel' : '🔵 Niedrig'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-3 p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-xs text-muted-foreground">Mögliche Ersparnis</p>
                        <p className="font-semibold">€{rec.estimatedSavings.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Auswirkung</p>
                        <p className="font-semibold">{rec.impact}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                      <p className="text-sm font-medium text-blue-900">💡 Empfohlene Aktion:</p>
                      <p className="text-sm text-blue-800 mt-1">{rec.action}</p>
                    </div>

                    <div className="flex gap-2">
                      {rec.action.includes('Einstellungen') && (
                        <Button
                          size="sm"
                          onClick={() => window.location.href = '/AISettings'}
                        >
                          Zu den Einstellungen
                        </Button>
                      )}
                      {rec.action.includes('Dashboard') && (
                        <Button
                          size="sm"
                          onClick={() => window.location.href = '/AdminDashboardAI'}
                        >
                          Zum Dashboard
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissRecommation(rec.id)}
                      >
                        Verbergen
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold">Alle optimiert!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sie nutzen Ihre AI-Ressourcen bereits sehr effizient.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setLoading(true);
          loadRecommendations();
        }}
      >
        Empfehlungen aktualisieren
      </Button>
    </div>
  );
}