import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { eventType, data } = await req.json();

    // 1. Budget Exceeded Event
    if (eventType === 'budget_exceeded') {
      await handleBudgetExceeded(base44, data);
    }

    // 2. Document Classification Event
    if (eventType === 'document_classified') {
      await handleDocumentClassified(base44, data);
    }

    // 3. Daily Recommendations Event
    if (eventType === 'generate_recommendations') {
      await generateDailyRecommendations(base44);
    }

    return Response.json({ success: true, eventType });
  } catch (error) {
    console.error('Workflow automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleBudgetExceeded(base44, data) {
  console.log('Handling budget exceeded event...');
  
  // 1. Disable all AI features
  const features = await base44.asServiceRole.entities.AIFeatureConfig.list();
  for (const feature of features) {
    await base44.asServiceRole.entities.AIFeatureConfig.update(feature.id, {
      is_enabled: false
    });
  }

  // 2. Send escalation email to all admins
  const users = await base44.asServiceRole.entities.User.list();
  const admins = users.filter(u => u.role === 'admin');

  for (const admin of admins) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: admin.email,
      subject: '🔴 URGENT: AI-Budget überschritten - Alle Features deaktiviert',
      body: `Hallo ${admin.full_name || 'Admin'},

das monatliche KI-Budget wurde überschritten. Zur Kostenekontrolle wurden alle AI-Features automatisch deaktiviert.

Budget-Status:
- Verbraucht: €${data.spent?.toFixed(2) || 'N/A'}
- Limit: €${data.limit?.toFixed(2) || 'N/A'}

Maßnahmen:
1. Alle AI-Features sind jetzt inaktiv
2. Benutzer können AI-Funktionen nicht verwenden
3. Das Budget wird am 1. des nächsten Monats zurückgesetzt

Handlung erforderlich:
- Prüfen Sie die Nutzungsmuster unter /AIUsageReports
- Erhöhen Sie das Budget oder optimieren Sie die Nutzung
- Re-aktivieren Sie Features manuell in /AISettings

Beste Grüße,
FinTutto AI System`
    });
  }

  // 3. Create audit log
  await base44.asServiceRole.entities.AIUsageLog.create({
    user_email: 'system',
    feature: 'budget_automation',
    model: 'n/a',
    input_tokens: 0,
    output_tokens: 0,
    cost_eur: 0,
    success: true,
    error_message: 'Budget exceeded - all features disabled'
  });
}

async function handleDocumentClassified(base44, data) {
  console.log('Handling document classification event...');
  
  if (data.classification === 'dringend' || data.priority === 'high') {
    // Get the assigned team
    const teamEmails = data.assignedTo || [];
    
    for (const email of teamEmails) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `🚨 Dringendes Dokument: ${data.documentTitle}`,
        body: `Hallo,

ein Dokument wurde automatisch als DRINGEND klassifiziert und erfordert Ihre Aufmerksamkeit.

Dokument: ${data.documentTitle}
Klassifizierung: ${data.classification}
Priorität: ${data.priority}

Handlung: Bitte melden Sie sich an und überprüfen Sie das Dokument unter ${data.documentLink || '/MeineDokumente'}

Beste Grüße,
FinTutto AI System`
      });
    }
  }
}

async function generateDailyRecommendations(base44) {
  console.log('Generating daily AI recommendations...');

  try {
    // 1. Get yesterday's usage data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
      created_date: { $gte: yesterdayStr }
    });

    if (!logs || logs.length === 0) {
      console.log('No usage data for yesterday');
      return;
    }

    // 2. Analyze patterns
    const totalCost = logs.reduce((sum, log) => sum + (log.cost_eur || 0), 0);
    const avgCostPerRequest = totalCost / logs.length;
    
    const featureStats = {};
    logs.forEach(log => {
      const feature = log.feature || 'unknown';
      if (!featureStats[feature]) {
        featureStats[feature] = { count: 0, cost: 0 };
      }
      featureStats[feature].count++;
      featureStats[feature].cost += log.cost_eur || 0;
    });

    // 3. Generate recommendations
    const recommendations = [];

    // Check for high cost features
    Object.entries(featureStats).forEach(([feature, stats]) => {
      if (stats.cost > totalCost * 0.5) {
        recommendations.push({
          type: 'high_cost_feature',
          feature,
          cost: stats.cost,
          message: `Feature "${feature}" verursacht ${(stats.cost / totalCost * 100).toFixed(1)}% der Kosten`
        });
      }
    });

    // Check for cache efficiency
    const cacheHits = logs.filter(l => (l.cache_read_tokens || 0) > 0).length;
    const cacheEfficiency = (cacheHits / logs.length) * 100;
    
    if (cacheEfficiency < 20) {
      recommendations.push({
        type: 'low_cache_efficiency',
        efficiency: cacheEfficiency.toFixed(1),
        message: `Prompt-Cache-Hit-Rate niedrig (${cacheEfficiency.toFixed(1)}%). Verwende einheitlichere Prompts.`
      });
    }

    // 4. Save recommendations
    if (recommendations.length > 0) {
      await base44.asServiceRole.entities.AIRecommendation.create({
        user_email: 'system',
        recommendation_type: 'daily_analysis',
        title: `Tägliche AI-Optimierungsempfehlungen (${yesterdayStr})`,
        recommendations,
        total_cost: totalCost,
        request_count: logs.length,
        status: 'new',
        data: { cacheEfficiency, featureStats }
      });
    }

    console.log(`Generated ${recommendations.length} recommendations`);
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}