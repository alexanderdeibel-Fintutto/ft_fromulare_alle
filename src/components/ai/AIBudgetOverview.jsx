import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from 'lucide-react';

export default function AIBudgetOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Aktuellen Monat berechnen
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Usage-Logs laden
      const logs = await base44.entities.AIUsageLog.filter({
        created_date: { $gte: startOfMonth.toISOString() }
      });
      
      // Settings laden
      const settingsList = await base44.entities.AISettings.list();
      const settings = settingsList?.[0] || { monthly_budget_eur: 50 };

      // Aggregieren
      const totalRequests = logs?.length || 0;
      const totalTokens = logs?.reduce((sum, l) => sum + (l.input_tokens || 0) + (l.output_tokens || 0), 0) || 0;
      const totalCost = logs?.reduce((sum, l) => sum + (l.cost_eur || 0), 0) || 0;
      const totalWithoutCache = logs?.reduce((sum, l) => sum + (l.cost_without_cache_eur || 0), 0) || 0;
      const savings = totalWithoutCache - totalCost;
      const savingsPercent = totalWithoutCache > 0 ? Math.round((savings / totalWithoutCache) * 100) : 0;
      
      setStats({
        requests: totalRequests,
        tokens: totalTokens,
        cost: Math.round(totalCost * 100) / 100,
        budget: settings.monthly_budget_eur,
        percent: Math.round((totalCost / settings.monthly_budget_eur) * 100),
        savings: Math.round(savings * 100) / 100,
        savingsPercent,
      });
    } catch (e) {
      console.error("Failed to load AI stats:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Lade Statistiken...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Keine Daten verfügbar</div>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = () => {
    if (stats.percent < 70) return "bg-green-500";
    if (stats.percent < 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressBarColor = () => {
    if (stats.percent < 70) return "[&>div]:bg-green-500";
    if (stats.percent < 90) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Übersicht diesen Monat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.requests.toLocaleString('de-DE')}</div>
            <div className="text-sm text-muted-foreground">Anfragen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.tokens.toLocaleString('de-DE')}</div>
            <div className="text-sm text-muted-foreground">Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">€{stats.cost.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Kosten</div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{stats.percent}% vom Budget</span>
            <span className="text-muted-foreground">€{stats.cost.toFixed(2)} / €{stats.budget.toFixed(2)}</span>
          </div>
          <Progress value={Math.min(stats.percent, 100)} className={getProgressBarColor()} />
        </div>
        
        {stats.savings > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 mt-3 bg-green-50 p-3 rounded-lg">
            <Sparkles className="w-4 h-4" />
            <span>
              Ersparnis durch Caching: <strong>€{stats.savings.toFixed(2)}</strong> ({stats.savingsPercent}%)
            </span>
          </div>
        )}

        {stats.percent >= 90 && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            ⚠️ Budget-Warnung: Sie haben {stats.percent}% Ihres monatlichen Budgets verbraucht
          </div>
        )}
      </CardContent>
    </Card>
  );
}