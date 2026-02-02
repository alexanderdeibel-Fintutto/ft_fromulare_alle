import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function MonthlyAICostsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  async function loadChartData() {
    try {
      const logs = await base44.entities.AIUsageLog.filter(
        { created_date: { $gte: format(subDays(new Date(), 30), 'yyyy-MM-dd') } },
        '-created_date',
        1000
      );

      const dailyData = {};
      logs.forEach(log => {
        const day = log.created_date.split('T')[0];
        if (!dailyData[day]) {
          dailyData[day] = { date: day, cost: 0, requests: 0, savings: 0 };
        }
        dailyData[day].cost += log.cost_eur || 0;
        dailyData[day].requests += 1;
        dailyData[day].savings += (log.cost_without_cache_eur || 0) - (log.cost_eur || 0);
      });

      setData(Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monatliche AI-Ausgaben (Letzte 30 Tage)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#EF4444" name="Kosten (€)" />
              <Line type="monotone" dataKey="savings" stroke="#10B981" name="Ersparnis durch Cache (€)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}