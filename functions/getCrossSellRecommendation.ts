import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { triggerPage, triggerEvent } = await req.json();

    // Get user's quota to determine triggers
    const quotas = await base44.entities.UserQuota.filter({
      user_email: user.email
    });
    const quota = quotas?.[0];

    // Get user's documents count
    const docs = await base44.entities.GeneratedDocument.filter(
      { user_email: user.email, is_deleted: false },
      '-created_date',
      10
    );

    let recommendation = null;

    // Trigger logic
    if (triggerEvent === 'limit_reached' && quota) {
      if (quota.documents_created >= quota.documents_limit * 0.9) {
        recommendation = {
          type: 'upgrade',
          message: 'Sie haben 90% Ihres Dokumentlimits erreicht',
          cta: 'Jetzt upgraden',
          target: 'upgrade_plan',
          priority: 'high'
        };
      }
    }

    if (triggerEvent === 'success' && docs?.length >= 5) {
      recommendation = {
        type: 'addon',
        message: 'Sie generieren regelmäßig Dokumente - mit einem Plan sparen Sie Geld',
        cta: 'Plan ansehen',
        target: 'purchase_plan',
        priority: 'medium'
      };
    }

    if (triggerEvent === 'page_view' && triggerPage === 'TemplateDetail') {
      recommendation = {
        type: 'bundle',
        message: 'Mit einem Bundle erhalten Sie Zugriff auf alle Vorlagen',
        cta: 'Bundle-Angebot',
        target: 'purchase_bundle',
        priority: 'high'
      };
    }

    // Log event
    try {
      await base44.entities.CrossSellEvent.create({
        user_email: user.email,
        recommendation_type: recommendation?.type || 'feature',
        trigger_event: triggerEvent,
        trigger_page: triggerPage,
        messaging: recommendation || {},
        shown_at: new Date().toISOString(),
        priority: recommendation?.priority || 'low'
      });
    } catch (err) {
      console.error('Log cross-sell event failed:', err);
    }

    return Response.json({
      success: true,
      recommendation: recommendation || null
    });
  } catch (error) {
    console.error('Cross-sell error:', error);
    return Response.json(
      { error: error.message || 'Failed to get recommendation' },
      { status: 500 }
    );
  }
});