import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MonthlyAICostsChart from '@/components/admin/MonthlyAICostsChart';
import TopAIFeaturesTable from '@/components/admin/TopAIFeaturesTable';
import CacheHitRateWidget from '@/components/admin/CacheHitRateWidget';
import CostOptimizationRecommendations from '@/components/ai/CostOptimizationRecommendations';
import { Download, Settings, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

export default function AdminDashboardAI() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  async function loadStats() {
    try {
      const logs = await base44.entities.AIUsageLog.filter(
        { 
          created_date: { 
            $gte: dateRange.start,
            $lte: dateRange.end
          }
        },
        '-created_date',
        10000
      );

      const settings = await base44.entities.AISettings.list('-created_date', 1);

      const totalCost = logs.reduce((sum, log) => sum + (log.cost_eur || 0), 0);
      const totalRequests = logs.length;
      const budget = settings?.[0]?.monthly_budget_eur || 50;
      const budgetPercent = Math.round((totalCost / budget) * 100);

      setStats({
        totalCost: totalCost.toFixed(2),
        totalRequests,
        avgCostPerRequest: totalRequests > 0 ? (totalCost / totalRequests).toFixed(4) : 0,
        budget,
        budgetPercent,
        requestsPerDay: (totalRequests / 30).toFixed(1)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Fehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  }

  async function exportAllData() {
    try {
      const logs = await base44.entities.AIUsageLog.filter({}, '-created_date', 100000);
      
      const headers = ['Datum', 'Feature', 'Benutzer', 'Model', 'Kosten', 'Anfragen', 'Erfolgsrate'];
      const rows = logs.map(log => [
        new Date(log.created_date).toLocaleString('de-DE'),
        log.feature,
        log.user_email,
        log.model,
        log.cost_eur.toFixed(2),
        log.input_tokens + log.output_tokens,
        log.success ? 'Ja' : 'Nein'
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-admin-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast.success('Export erfolgreich');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Exportfehler');
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">AI Admin Dashboard</h1>
        <p className="text-muted-foreground">Umfassende Übersicht aller KI-Aktivitäten und Kosten</p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Gesamtkosten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalCost}</div>
              <p className="text-xs text-muted-foreground mt-1">von €{stats.budget} Budget</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Budget-Auslastung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.budgetPercent}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    stats.budgetPercent >= 100 ? 'bg-red-500' :
                    stats.budgetPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.budgetPercent, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Anfragen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Ø {stats.requestsPerDay}/Tag</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ø Kosten/Anfrage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.avgCostPerRequest}</div>
              <p className="text-xs text-muted-foreground mt-1">Performance-Metrik</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Zeitraum</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium block mb-1">Von</label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium block mb-1">Bis</label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyAICostsChart />
        <CacheHitRateWidget />
      </div>

      {/* Features Table */}
      <TopAIFeaturesTable />

      {/* Cost Optimization Section */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 KI-Kostenoptimierung für Ihre Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <CostOptimizationRecommendations isAdmin={true} />
        </CardContent>
      </Card>

      {/* Tabs for Additional Info */}
      <Tabs defaultValue="reports" className="mt-8">
        <TabsList>
          <TabsTrigger value="reports">Berichte</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verfügbare Berichte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Zu Nutzungsberichten
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                System-Prompts Manager
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget & Feature-Verwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Zu AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daten Exportieren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={exportAllData} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Alle Daten als CSV exportieren
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Nach Google Drive exportieren
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Nach Slack senden
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}