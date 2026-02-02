import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AIUsageChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  async function loadChartData() {
    try {
      // Letzte 30 Tage
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Usage-Logs laden
      const logs = await base44.entities.AIUsageLog.filter({
        created_date: { $gte: thirtyDaysAgo.toISOString() }
      });

      // Nach Tag gruppieren
      const dailyData = {};
      
      logs?.forEach((log) => {
        const date = new Date(log.created_date).toLocaleDateString('de-DE');
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            cost: 0,
            costWithoutCache: 0,
            requests: 0,
          };
        }
        dailyData[date].cost += log.cost_eur || 0;
        dailyData[date].costWithoutCache += log.cost_without_cache_eur || 0;
        dailyData[date].requests += 1;
      });

      // In Array umwandeln und sortieren
      const chartArray = Object.values(dailyData)
        .sort((a, b) => new Date(a.date.split('.').reverse().join('-')) - new Date(b.date.split('.').reverse().join('-')))
        .map(item => ({
          ...item,
          cost: Math.round(item.cost * 100) / 100,
          costWithoutCache: Math.round(item.costWithoutCache * 100) / 100,
          savings: Math.round((item.costWithoutCache - item.cost) * 100) / 100,
        }));

      setChartData(chartArray);
    } catch (e) {
      console.error("Failed to load chart data:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Lade Verlaufsdaten...</div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📈 Nutzungsverlauf (30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Noch keine Nutzungsdaten vorhanden
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Nutzungsverlauf (30 Tage)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Kosten (€)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => `€${value.toFixed(2)}`}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cost" 
              stroke="#10b981" 
              name="Kosten (mit Cache)"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="costWithoutCache" 
              stroke="#ef4444" 
              name="Kosten (ohne Cache)"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500 rounded"></div>
            <span className="text-muted-foreground">Mit Prompt-Caching</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 5px, transparent 5px, transparent 10px)' }}></div>
            <span className="text-muted-foreground">Ohne Caching (Vergleich)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}