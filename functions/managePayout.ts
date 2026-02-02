import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payout_data } = await req.json();

    if (action === 'initiate') {
      const payout = await base44.entities.Payout.create({
        user_email: user.email,
        ...payout_data,
        status: 'pending',
        initiated_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        payout_id: payout.id,
        message: 'Payout initiated'
      });
    }

    if (action === 'process') {
      const { payout_id } = await req.json();

      const payouts = await base44.entities.Payout.filter(
        { id: payout_id },
        null,
        1
      );

      if (!payouts || payouts.length === 0) {
        return Response.json({ error: 'Payout not found' }, { status: 404 });
      }

      const payout = payouts[0];

      // Simulate payout processing
      await base44.entities.Payout.update(payout_id, {
        status: 'processing',
        reference_number: 'TXN_' + Date.now()
      });

      return Response.json({
        success: true,
        status: 'processing',
        reference: 'TXN_' + Date.now()
      });
    }

    if (action === 'complete') {
      const { payout_id } = await req.json();

      await base44.entities.Payout.update(payout_id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        status: 'completed'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing payout:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});