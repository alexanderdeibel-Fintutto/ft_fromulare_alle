import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Analyze user behavior and generate recommendations
    const users = await base44.asServiceRole.entities.User.list();
    const allUsageLogs = await base44.asServiceRole.entities.AIUsageLog.list();
    
    const recommendations = [];

    for (const targetUser of users) {
      const userLogs = allUsageLogs?.filter(log => log.user_email === targetUser.email) || [];
      
      if (userLogs.length === 0) continue;

      // Analyze usage patterns
      const featureCounts = {};
      userLogs.forEach(log => {
        featureCounts[log.feature] = (featureCounts[log.feature] || 0) + 1;
      });

      // Recommendation 1: If user heavily uses chat, recommend form_generation
      if ((featureCounts.chat || 0) > 10 && !(featureCounts.form_generation || 0)) {
        recommendations.push({
          user_email: targetUser.email,
          item_type: 'feature',
          item_id: 'form_generation',
          item_title: 'KI-Formular-Generator',
          recommendation_type: 'feature',
          reason: 'Sie nutzen den Chat intensiv. Der Formular-Generator könnte Ihre Arbeit beschleunigen.',
          confidence_score: 0.85,
          dismissed: false
        });
      }

      // Recommendation 2: If user uses OCR, recommend DocumentIntelligence
      if ((featureCounts.ocr || 0) > 5) {
        recommendations.push({
          user_email: targetUser.email,
          item_type: 'feature',
          item_id: 'document_intelligence',
          item_title: 'Erweiterte Dokumenten-Analyse',
          recommendation_type: 'upgrade',
          reason: 'Sie scannen häufig Dokumente. Die erweiterte Analyse bietet tiefere Einblicke.',
          confidence_score: 0.78,
          dismissed: false
        });
      }

      // Recommendation 3: Cost optimization
      const avgCost = userLogs.reduce((sum, log) => sum + (log.cost_eur || 0), 0) / userLogs.length;
      if (avgCost > 0.01) {
        recommendations.push({
          user_email: targetUser.email,
          item_type: 'setting',
          item_id: 'enable_caching',
          item_title: 'Prompt-Caching aktivieren',
          recommendation_type: 'optimization',
          reason: 'Mit Prompt-Caching können Sie bis zu 90% der KI-Kosten sparen.',
          confidence_score: 0.92,
          dismissed: false
        });
      }

      // Recommendation 4: Model optimization
      const haikuLogs = userLogs.filter(log => log.model?.includes('haiku'));
      const opusLogs = userLogs.filter(log => log.model?.includes('opus'));
      
      if (opusLogs.length > haikuLogs.length * 2) {
        recommendations.push({
          user_email: targetUser.email,
          item_type: 'setting',
          item_id: 'use_haiku_model',
          item_title: 'Günstigeres Modell nutzen',
          recommendation_type: 'cost_saving',
          reason: 'Für viele Aufgaben reicht das Haiku-Modell – 5x günstiger als Opus.',
          confidence_score: 0.70,
          dismissed: false
        });
      }
    }

    // Create recommendations in database
    let created = 0;
    for (const rec of recommendations) {
      try {
        await base44.asServiceRole.entities.AIRecommendation.create(rec);
        created++;
      } catch (e) {
        console.error('Failed to create recommendation:', e);
      }
    }

    return Response.json({
      success: true,
      analyzed_users: users.length,
      recommendations_generated: recommendations.length,
      recommendations_created: created
    });

  } catch (error) {
    console.error('Recommendation generation error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});