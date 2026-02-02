import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, subscription_id, amount_cents, credit_source } = await req.json();

    // Get or create credit account
    const existing = await base44.entities.CreditAccount.filter(
      { user_email: user.email, subscription_id },
      null,
      1
    );

    let account = existing?.[0];

    if (action === 'add_credits') {
      if (!account) {
        account = await base44.entities.CreditAccount.create({
          user_email: user.email,
          subscription_id,
          total_credits_cents: amount_cents,
          available_credits_cents: amount_cents,
          credit_source: credit_source || 'prepaid',
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      } else {
        const newTotal = (account.total_credits_cents || 0) + amount_cents;
        const newAvailable = (account.available_credits_cents || 0) + amount_cents;

        account = await base44.entities.CreditAccount.update(account.id, {
          total_credits_cents: newTotal,
          available_credits_cents: newAvailable
        });
      }

      return Response.json({
        success: true,
        total_credits: account.total_credits_cents / 100,
        available_credits: account.available_credits_cents / 100
      });
    }

    if (action === 'use_credits') {
      if (!account || account.available_credits_cents < amount_cents) {
        return Response.json({ error: 'Insufficient credits' }, { status: 400 });
      }

      const newUsed = (account.used_credits_cents || 0) + amount_cents;
      const newAvailable = account.available_credits_cents - amount_cents;

      account = await base44.entities.CreditAccount.update(account.id, {
        used_credits_cents: newUsed,
        available_credits_cents: newAvailable
      });

      return Response.json({
        success: true,
        used_credits: account.used_credits_cents / 100,
        available_credits: newAvailable / 100
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing credits:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});