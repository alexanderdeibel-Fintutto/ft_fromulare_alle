import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all subscriptions ending soon
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      {},
      null,
      1000
    );

    let remindersSent = 0;
    const today = new Date();

    for (const sub of subscriptions || []) {
      if (!sub.next_billing_date) continue;

      const renewalDate = new Date(sub.next_billing_date);
      const daysUntilRenewal = Math.floor((renewalDate - today) / (1000 * 60 * 60 * 24));

      // Send reminders at 30, 14, and 7 days before
      const reminderDays = [30, 14, 7];
      
      for (const days of reminderDays) {
        if (Math.abs(daysUntilRenewal - days) <= 1) {
          const existing = await base44.entities.RenewalReminder.filter(
            {
              subscription_id: sub.id,
              reminder_type: days === 30 ? 'first_reminder' : days === 14 ? 'second_reminder' : 'final_reminder'
            },
            null,
            1
          );

          if (!existing || existing.length === 0) {
            await base44.entities.RenewalReminder.create({
              user_email: sub.user_email,
              subscription_id: sub.id,
              renewal_date: sub.next_billing_date,
              days_before_renewal: days,
              reminder_type: days === 30 ? 'first_reminder' : days === 14 ? 'second_reminder' : 'final_reminder',
              current_plan: sub.plan,
              renewal_amount_cents: sub.amount_cents,
              reminder_sent: true,
              sent_at: new Date().toISOString(),
              status: 'sent'
            });

            remindersSent++;
          }
        }
      }
    }

    return Response.json({
      success: true,
      reminders_sent: remindersSent
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});