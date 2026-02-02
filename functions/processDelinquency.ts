import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === 'identify_delinquent') {
      // Finde alle überfälligen Invoices
      const invoices = await base44.asServiceRole.entities.Invoice.filter(
        { status: 'pending' },
        null,
        1000
      );

      const today = new Date();
      let processedCount = 0;

      for (const invoice of invoices || []) {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        if (daysOverdue > 0) {
          // Erstelle oder update Delinquency Record
          const existing = await base44.asServiceRole.entities.DelinquencyAccount.filter(
            { invoice_id: invoice.id },
            null,
            1
          );

          if (existing && existing.length > 0) {
            await base44.asServiceRole.entities.DelinquencyAccount.update(existing[0].id, {
              days_overdue: daysOverdue,
              amount_overdue_cents: invoice.amount_cents
            });
          } else {
            await base44.asServiceRole.entities.DelinquencyAccount.create({
              user_email: invoice.user_email,
              invoice_id: invoice.id,
              amount_overdue_cents: invoice.amount_cents,
              days_overdue: daysOverdue,
              delinquency_stage: 1,
              collection_status: 'payment_pending'
            });
          }

          processedCount++;
        }
      }

      return Response.json({
        success: true,
        delinquent_accounts: processedCount
      });
    }

    if (action === 'escalate') {
      // Eskaliere Stage für sehr überfällige Konten
      const delinquent = await base44.asServiceRole.entities.DelinquencyAccount.filter(
        { collection_status: 'payment_pending' },
        null,
        1000
      );

      let escalatedCount = 0;

      for (const account of delinquent || []) {
        if (account.days_overdue > 60 && account.delinquency_stage < 5) {
          await base44.asServiceRole.entities.DelinquencyAccount.update(account.id, {
            delinquency_stage: account.delinquency_stage + 1,
            collection_status: account.delinquency_stage >= 3 ? 'escalated' : 'reminder_sent'
          });

          escalatedCount++;
        }
      }

      return Response.json({
        success: true,
        escalated_accounts: escalatedCount
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing delinquency:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});