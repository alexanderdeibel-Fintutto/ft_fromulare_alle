import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import CostOptimizationRecommendations from '../components/ai/CostOptimizationRecommendations';

export default function UserAIDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get user's AI usage
      const logs = await base44.entities.AIUsageLog.filter(
        { user_email: currentUser.email },
        '-created_date',
        1000
      );

      // Get AI settings for budget info
      const settings = await base44.entities.AISettings.list('-created_date', 1);

      // Calculate stats for this month
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthLogs = logs.filter(l => l.created_date.startsWith(currentMonth));
      
      const totalCost = monthLogs.reduce((sum, log) => sum + (log.cost_eur || 0), 0);
      const budget = settings?.[0]?.monthly_budget_eur || 50;
      const budgetPercent = Math.round((totalCost / budget) * 100);
      const budgetWarningThreshold = settings?.[0]?.budget_warning_threshold || 80;

      setStats({
        totalCost: totalCost.toFixed(2),
        totalRequests: monthLogs.length,
        budget,
        budgetPercent,
        budgetWarning: budgetPercent >= budgetWarningThreshold,
        avgCostPerRequest: monthLogs.length > 0 ? (totalCost / monthLogs.length).toFixed(4) : 0,
        successRate: monthLogs.length > 0 
          ? Math.round((monthLogs.filter(l => l.success).length / monthLogs.length) * 100)
          : 0
      });

      // Get enabled features
      const allFeatures = await base44.entities.AIFeatureConfig.list();
      const userAccessibleFeatures = allFeatures.filter(f => {
        if (!f.is_enabled) return false;
        if (f.requires_subscription && f.requires_subscription !== 'free') {
          return (currentUser.subscription_tier || 'free') >= f.requires_subscription;
        }
        return true;
      });

      setFeatures(userAccessibleFeatures);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mein AI Dashboard</h1>
        <p className="text-muted-foreground">Übersicht Ihrer KI-Nutzung und verfügbaren Features</p>
      </div>

      {/* Budget Alert */}
      {stats?.budgetWarning && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900">Budget-Warnung</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Sie haben {stats.budgetPercent}% Ihres monatlichen AI-Budgets verbraucht. 
                  Bitte achten Sie auf Ihre Nutzung.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monatliche Kosten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.totalCost}</div>
            <p className="text-xs text-muted-foreground mt-1">von €{stats?.budget}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Budget-Auslastung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.budgetPercent}%</div>
            <Progress value={stats?.budgetPercent || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Anfragen (Monat)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Ø €{stats?.avgCostPerRequest}/Anfrage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Erfolgsrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">der Anfragen erfolgreich</p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Recommendations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">💡 Kostenoptimierungsempfehlungen</h2>
        <CostOptimizationRecommendations isAdmin={false} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="features" className="w-full">
        <TabsList>
          <TabsTrigger value="features">Verfügbare Features</TabsTrigger>
          <TabsTrigger value="usage">Nutzungsverlauf</TabsTrigger>
          <TabsTrigger value="limits">Meine Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Features für Sie verfügbar ({features.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.length > 0 ? (
                  features.map(feature => (
                    <Card key={feature.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{feature.display_name}</h3>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                          {feature.is_enabled ? (
                            <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                          ) : (
                            <Badge variant="destructive">Inaktiv</Badge>
                          )}
                        </div>
                        {feature.last_used_at && (
                          <p className="text-xs text-muted-foreground">
                            Zuletzt genutzt: {format(new Date(feature.last_used_at), 'dd.MM.yyyy HH:mm')}
                          </p>
                        )}
                        <Button size="sm" className="mt-3 w-full">
                          <Zap className="w-4 h-4 mr-1" />
                          {feature.feature_key} starten
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-2">Keine Features verfügbar</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ihre Nutzung (letzte 30 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>📊 Detaillierte Nutzungsstatistiken werden in Kürze angezeigt</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meine Nutzungslimits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Anfragen pro Stunde</span>
                  <span className="text-sm">20 max</span>
                </div>
                <Progress value={0} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Anfragen pro Tag</span>
                  <span className="text-sm">100 max</span>
                </div>
                <Progress value={0} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Monatliches Budget</span>
                  <span className="text-sm">€{stats?.budget}</span>
                </div>
                <Progress value={stats?.budgetPercent || 0} />
              </div>
              <Button variant="outline" className="w-full mt-4">
                💰 Limits anpassen (Premium erforderlich)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}