import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function CacheHitRateWidget() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const logs = await base44.entities.AIUsageLog.filter(
        { 
          created_date: { $gte: format(subDays(new Date(), 30), 'yyyy-MM-dd') },
          success: true
        },
        '-created_date',
        1000
      );

      let totalTokens = 0;
      let cacheHits = 0;
      let cacheCost = 0;
      let normalCost = 0;

      logs.forEach(log => {
        const cacheTokens = (log.cache_read_tokens || 0) + (log.cache_creation_tokens || 0);
        if (cacheTokens > 0) cacheHits++;
        
        totalTokens += (log.cache_read_tokens || 0) + (log.input_tokens || 0);
        cacheCost += (log.cost_eur || 0);
        normalCost += (log.cost_without_cache_eur || 0);
      });

      const hitRate = logs.length > 0 ? (cacheHits / logs.length) * 100 : 0;
      const savings = normalCost - cacheCost;
      const savingsPercent = normalCost > 0 ? (savings / normalCost) * 100 : 0;

      setStats({
        hitRate: Math.round(hitRate),
        totalRequests: logs.length,
        cacheHits,
        savings: savings.toFixed(2),
        savingsPercent: savingsPercent.toFixed(1)
      });
    } catch (error) {
      console.error('Error loading cache stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cache-Hit-Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache-Effizienz (30 Tage)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Hit-Rate</span>
            <span className="text-sm font-semibold">{stats.hitRate}%</span>
          </div>
          <Progress value={stats.hitRate} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Cache Hits</p>
            <p className="text-2xl font-bold text-green-600">{stats.cacheHits}</p>
            <p className="text-xs text-muted-foreground">von {stats.totalRequests}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ersparnis</p>
            <p className="text-2xl font-bold text-green-600">€{stats.savings}</p>
            <p className="text-xs text-muted-foreground">{stats.savingsPercent}% Reduktion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}