import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Zap, DollarSign } from 'lucide-react';

export default function CacheEfficiencyStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const logs = await base44.entities.AIUsageLog.filter({
        created_date: { $gte: thirtyDaysAgo.toISOString() },
        success: true
      });

      if (!logs || logs.length === 0) {
        setStats(null);
        setLoading(false);
        return;
      }

      // Calculate cache statistics
      const totalRequests = logs.length;
      const requestsWithCacheRead = logs.filter(l => (l.cache_read_tokens || 0) > 0).length;
      const cacheHitRate = (requestsWithCacheRead / totalRequests) * 100;

      const totalSavings = logs.reduce((sum, log) => sum + (log.cost_without_cache_eur - log.cost_eur || 0), 0);
      const totalCost = logs.reduce((sum, log) => sum + (log.cost_eur || 0), 0);
      const totalCostWithoutCache = logs.reduce((sum, log) => sum + (log.cost_without_cache_eur || 0), 0);

      const avgResponseTime = logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / totalRequests;

      const totalCacheReadTokens = logs.reduce((sum, log) => sum + (log.cache_read_tokens || 0), 0);
      const totalInputTokens = logs.reduce((sum, log) => sum + (log.input_tokens || 0), 0);

      setStats({
        totalRequests,
        requestsWithCacheRead,
        cacheHitRate: Math.round(cacheHitRate),
        totalSavings: Math.round(totalSavings * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalCostWithoutCache: Math.round(totalCostWithoutCache * 100) / 100,
        savingsPercent: totalCostWithoutCache > 0 
          ? Math.round((totalSavings / totalCostWithoutCache) * 100)
          : 0,
        avgResponseTime: Math.round(avgResponseTime),
        totalCacheReadTokens: Math.round(totalCacheReadTokens / 1000), // in K
        totalInputTokens: Math.round(totalInputTokens / 1000) // in K
      });

    } catch (error) {
      console.error('Error loading cache stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Lade Statistiken...</div>;
  }

  if (!stats) {
    return <div className="text-center py-4 text-muted-foreground">Keine Daten verfügbar</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Cache Hit Rate</h3>
        </div>
        <div className="text-3xl font-bold text-green-900">{stats.cacheHitRate}%</div>
        <p className="text-sm text-green-700 mt-1">
          {stats.requestsWithCacheRead} von {stats.totalRequests} Anfragen
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Gesamt-Ersparnis</h3>
        </div>
        <div className="text-3xl font-bold text-blue-900">€{stats.totalSavings}</div>
        <p className="text-sm text-blue-700 mt-1">
          {stats.savingsPercent}% Kostenreduktion
        </p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Ø Response Time</h3>
        </div>
        <div className="text-3xl font-bold text-purple-900">{stats.avgResponseTime}ms</div>
        <p className="text-sm text-purple-700 mt-1">
          {stats.totalCacheReadTokens}K Tokens aus Cache
        </p>
      </div>

      <div className="col-span-full bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Kosten-Übersicht</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tatsächliche Kosten</p>
            <p className="text-xl font-bold text-gray-900">€{stats.totalCost}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ohne Cache</p>
            <p className="text-xl font-bold text-gray-500">€{stats.totalCostWithoutCache}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ersparnis</p>
            <p className="text-xl font-bold text-green-600">€{stats.totalSavings}</p>
          </div>
        </div>
      </div>
    </div>
  );
}