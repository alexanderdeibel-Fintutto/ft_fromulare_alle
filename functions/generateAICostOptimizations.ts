import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin';
    const currentMonth = new Date().toISOString().substring(0, 7);

    // Get usage logs
    let logs;
    if (isAdmin) {
      logs = await base44.entities.AIUsageLog.filter(
        { created_date: { $gte: currentMonth } },
        '-created_date',
        5000
      );
    } else {
      logs = await base44.entities.AIUsageLog.filter(
        { user_email: user.email, created_date: { $gte: currentMonth } },
        '-created_date',
        1000
      );
    }

    if (!logs || logs.length === 0) {
      return Response.json({ recommendations: [], analysis: {} });
    }

    // Analyze usage patterns
    const analysis = analyzeUsagePatterns(logs);
    const recommendations = generateRecommendations(analysis, logs);

    return Response.json({
      recommendations,
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function analyzeUsagePatterns(logs) {
  const analysis = {
    totalRequests: logs.length,
    totalCost: 0,
    byFeature: {},
    byModel: {},
    cacheStats: {
      totalWithCache: 0,
      cacheHits: 0,
      cacheSavings: 0
    },
    errorRate: 0,
    peakUsageHour: null,
    averageResponseTime: 0
  };

  let totalResponseTime = 0;
  let errorCount = 0;
  const hourlyUsage = {};
  const peakByHour = {};

  logs.forEach(log => {
    // Total cost
    analysis.totalCost += log.cost_eur || 0;

    // By feature
    if (!analysis.byFeature[log.feature]) {
      analysis.byFeature[log.feature] = {
        count: 0,
        cost: 0,
        avgCost: 0,
        successCount: 0
      };
    }
    analysis.byFeature[log.feature].count += 1;
    analysis.byFeature[log.feature].cost += log.cost_eur || 0;
    if (log.success) {
      analysis.byFeature[log.feature].successCount += 1;
    }

    // By model
    if (!analysis.byModel[log.model]) {
      analysis.byModel[log.model] = {
        count: 0,
        cost: 0,
        avgCost: 0
      };
    }
    analysis.byModel[log.model].count += 1;
    analysis.byModel[log.model].cost += log.cost_eur || 0;

    // Cache stats
    if (log.cache_read_tokens > 0) {
      analysis.cacheStats.totalWithCache += 1;
      analysis.cacheStats.cacheHits += 1;
      analysis.cacheStats.cacheSavings += log.cost_eur - (log.cost_without_cache_eur || log.cost_eur);
    }

    // Error rate
    if (!log.success) {
      errorCount += 1;
    }

    // Response time
    if (log.response_time_ms) {
      totalResponseTime += log.response_time_ms;
    }

    // Peak usage hour
    const hour = new Date(log.created_date).getHours();
    hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
  });

  // Calculate averages
  Object.keys(analysis.byFeature).forEach(feature => {
    analysis.byFeature[feature].avgCost = 
      analysis.byFeature[feature].cost / analysis.byFeature[feature].count;
  });

  Object.keys(analysis.byModel).forEach(model => {
    analysis.byModel[model].avgCost = 
      analysis.byModel[model].cost / analysis.byModel[model].count;
  });

  analysis.errorRate = (errorCount / logs.length) * 100;
  analysis.averageResponseTime = totalResponseTime / logs.length;
  analysis.peakUsageHour = Object.keys(hourlyUsage).reduce((a, b) => 
    hourlyUsage[a] > hourlyUsage[b] ? a : b
  );

  return analysis;
}

function generateRecommendations(analysis, logs) {
  const recommendations = [];

  // 1. Cache optimization
  if (analysis.cacheStats.totalWithCache === 0) {
    recommendations.push({
      id: 'enable_caching',
      priority: 'high',
      category: 'caching',
      title: 'Prompt-Caching aktivieren',
      description: 'Sie nutzen noch kein Prompt-Caching. Dies könnte Ihre Kosten um bis zu 90% senken.',
      estimatedSavings: analysis.totalCost * 0.3,
      action: 'Aktivieren Sie Prompt-Caching in den KI-Einstellungen',
      impact: 'Hoch'
    });
  } else {
    const cacheUtilization = (analysis.cacheStats.cacheHits / analysis.cacheStats.totalWithCache) * 100;
    if (cacheUtilization < 30) {
      recommendations.push({
        id: 'improve_caching',
        priority: 'medium',
        category: 'caching',
        title: 'Caching-Effizienz verbessern',
        description: `Ihre Caching-Nutzung beträgt nur ${cacheUtilization.toFixed(1)}%. Verwenden Sie längere, stabilere Prompts.`,
        estimatedSavings: analysis.totalCost * 0.15,
        action: 'Überarbeiten Sie Ihre Prompts für besseres Caching',
        impact: 'Mittel'
      });
    }
  }

  // 2. Underutilized features
  const featureUsage = Object.entries(analysis.byFeature)
    .map(([feature, data]) => ({ feature, ...data }))
    .sort((a, b) => b.cost - a.cost);

  featureUsage.forEach((featureData, idx) => {
    if (featureData.count < 5 && featureData.cost > 0) {
      recommendations.push({
        id: `underutilized_${featureData.feature}`,
        priority: 'medium',
        category: 'feature_usage',
        title: `Feature "${featureData.feature}" wird selten genutzt`,
        description: `Dieses Feature wurde nur ${featureData.count}x verwendet und kostet durchschnittlich €${featureData.avgCost.toFixed(4)} pro Anfrage.`,
        estimatedSavings: featureData.cost * 0.5,
        action: `Deaktivieren Sie "${featureData.feature}" wenn nicht mehr nötig`,
        impact: 'Niedrig'
      });
    }
  });

  // 3. Model optimization
  const modelUsage = Object.entries(analysis.byModel)
    .map(([model, data]) => ({ model, ...data }))
    .sort((a, b) => b.cost - a.cost);

  if (modelUsage.length > 1) {
    const mostExpensive = modelUsage[0];
    const mostEfficient = modelUsage[modelUsage.length - 1];

    if (mostExpensive.avgCost > mostEfficient.avgCost * 2) {
      recommendations.push({
        id: 'model_optimization',
        priority: 'high',
        category: 'model_selection',
        title: 'Verwenden Sie ein kostengünstigeres Modell',
        description: `${mostExpensive.model} kostet €${mostExpensive.avgCost.toFixed(4)}/Anfrage. Das Modell ${mostEfficient.model} kostet nur €${mostEfficient.avgCost.toFixed(4)}/Anfrage.`,
        estimatedSavings: (mostExpensive.avgCost - mostEfficient.avgCost) * mostExpensive.count,
        action: `Wechseln Sie für diese Anfragen zu ${mostEfficient.model}`,
        impact: 'Hoch'
      });
    }
  }

  // 4. Error rate optimization
  if (analysis.errorRate > 5) {
    recommendations.push({
      id: 'error_reduction',
      priority: 'high',
      category: 'quality',
      title: 'Fehlerrate reduzieren',
      description: `Ihre Fehlerrate beträgt ${analysis.errorRate.toFixed(1)}%. Jeder Fehler kostet Geld ohne Ergebnis.`,
      estimatedSavings: (analysis.totalCost * analysis.errorRate) / 100,
      action: 'Überprüfen Sie Ihre Prompts und Parameter für bessere Ergebnisse',
      impact: 'Hoch'
    });
  }

  // 5. Peak hour optimization
  if (analysis.peakUsageHour !== null) {
    recommendations.push({
      id: 'batch_processing',
      priority: 'low',
      category: 'timing',
      title: 'Batch-Processing für Off-Peak-Zeiten nutzen',
      description: `Ihre Spitzenlastzeit ist ${analysis.peakUsageHour}:00 Uhr. Batch-Processing könnte 20% günstiger sein.`,
      estimatedSavings: analysis.totalCost * 0.05,
      action: 'Aktivieren Sie Batch-Processing für nicht-dringende Anfragen',
      impact: 'Niedrig'
    });
  }

  // 6. Rate limit optimization
  const avgCostPerRequest = analysis.totalCost / analysis.totalRequests;
  if (avgCostPerRequest < 0.001) {
    recommendations.push({
      id: 'rate_increase',
      priority: 'low',
      category: 'rate_limits',
      title: 'Rate Limits erhöhen',
      description: 'Ihre durchschnittliche Anfrage kostet nur €' + avgCostPerRequest.toFixed(4) + '. Sie könnten mehr Features nutzen.',
      estimatedSavings: 0,
      action: 'Erwägen Sie, Ihre Rate Limits zu erhöhen für mehr Features',
      impact: 'Neutral'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}