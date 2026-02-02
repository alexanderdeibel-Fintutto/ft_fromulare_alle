import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pack5_purchase_id } = await req.json();

    if (!pack5_purchase_id) {
      return Response.json({ error: 'pack5_purchase_id required' }, { status: 400 });
    }

    // Hole den Pack-5 Kauf
    const purchases = await base44.entities.TemplatePurchase.filter(
      { id: pack5_purchase_id, user_email: user.email, package_type: 'pack_5' },
      null,
      1
    );

    if (!purchases || purchases.length === 0) {
      return Response.json({ error: 'Purchase not found or not authorized' }, { status: 404 });
    }

    const currentPurchase = purchases[0];
    const remainingCredits = currentPurchase.credits_remaining || 5;

    // Prüfe ob Credits vorhanden sind
    if (remainingCredits <= 0) {
      return Response.json({ 
        error: 'Keine Credits verfügbar',
        remaining_credits: 0
      }, { status: 402 });
    }

    // Reduziere Credits um 1
    const newCredits = Math.max(0, remainingCredits - 1);

    // Update Purchase
    await base44.entities.TemplatePurchase.update(pack5_purchase_id, {
      credits_remaining: newCredits
    });

    // Log Usage (async, nicht blockierend)
    try {
      await base44.asServiceRole.entities.CreditsUsageLog.create({
        user_email,
        pack5_purchase_id,
        template_id: null, // Wird vom Client nicht mitgesendet
        template_name: 'Template',
        credits_consumed: 1,
        credits_remaining: newCredits,
        action_type: 'download'
      });
    } catch (err) {
      // Log-Error sollte nicht den Download blockieren
      console.warn('Failed to log credit usage:', err);
    }

    return Response.json({
      success: true,
      remaining_credits: newCredits,
      message: newCredits === 0 ? 'Letzter Credit verbraucht!' : `${newCredits} Credits übrig`,
      purchase_id: pack5_purchase_id
    });
  } catch (error) {
    console.error('Error consuming template:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});