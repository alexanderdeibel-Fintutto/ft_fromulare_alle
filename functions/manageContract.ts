import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, contract_data } = await req.json();

    if (action === 'create') {
      const contract = await base44.entities.Contract.create({
        user_email: user.email,
        ...contract_data,
        renewal_reminder_date: calculateReminderDate(contract_data.end_date)
      });

      return Response.json({
        success: true,
        contract_id: contract.id,
        message: 'Contract created'
      });
    }

    if (action === 'check_renewals') {
      // Admin function: Prüfe auf Verträge, die demnächst ablaufen
      const contracts = await base44.asServiceRole.entities.Contract.filter(
        { status: 'active' },
        'renewal_date',
        1000
      );

      const today = new Date();
      const renewalDue = [];

      for (const contract of contracts || []) {
        const renewalDate = new Date(contract.renewal_date);
        const daysUntilRenewal = Math.floor((renewalDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilRenewal <= 30 && !contract.renewal_reminder_sent) {
          renewalDue.push(contract);

          // Sende Erinnerung
          await base44.integrations.Core.SendEmail({
            to: contract.user_email,
            subject: `Vertrag ${contract.contract_number} wird demnächst erneuert`,
            body: `Ihr Vertrag endet am ${contract.end_date}. Automatische Verlängerung: ${contract.auto_renew ? 'Ja' : 'Nein'}`
          });

          // Update Contract
          await base44.asServiceRole.entities.Contract.update(contract.id, {
            renewal_reminder_sent: true
          });
        }
      }

      return Response.json({
        success: true,
        renewals_due: renewalDue.length,
        contracts: renewalDue
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing contract:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateReminderDate(endDate) {
  const date = new Date(endDate);
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}