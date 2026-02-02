import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { invoice_id, action } = await req.json();

    // Get invoice
    const invoices = await base44.asServiceRole.entities.Invoice.filter(
      { id: invoice_id },
      null,
      1
    );

    if (!invoices || invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    if (action === 'retry_payment') {
      // Simulate payment retry
      await base44.asServiceRole.entities.Invoice.update(invoice_id, {
        status: 'processing'
      });

      return Response.json({
        success: true,
        action: 'retry_initiated',
        invoice_id
      });
    }

    if (action === 'pause_service') {
      // Pause subscription
      const subs = await base44.asServiceRole.entities.Subscription.filter(
        { user_email: invoice.user_email },
        null,
        1
      );

      if (subs && subs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
          status: 'paused'
        });
      }

      return Response.json({
        success: true,
        action: 'service_paused'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing dunning:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});