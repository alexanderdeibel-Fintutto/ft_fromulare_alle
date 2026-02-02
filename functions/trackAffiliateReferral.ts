import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { affiliate_code, referred_user_email, purchase_id, purchase_amount_cents } = await req.json();

    if (!affiliate_code || !referred_user_email || !purchase_id || !purchase_amount_cents) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hole Affiliate Account
    const affiliates = await base44.asServiceRole.entities.AffiliateAccount.filter(
      { affiliate_code },
      null,
      1
    );

    if (!affiliates || affiliates.length === 0) {
      return Response.json({ error: 'Affiliate code not found' }, { status: 404 });
    }

    const affiliate = affiliates[0];
    const commissionAmount = Math.round(purchase_amount_cents * (affiliate.commission_percentage / 100));

    // Erstelle Commission Record
    const commission = await base44.asServiceRole.entities.AffiliateCommission.create({
      affiliate_email: affiliate.user_email,
      affiliate_code,
      referred_user_email,
      purchase_id,
      purchase_amount_cents,
      commission_percentage: affiliate.commission_percentage,
      commission_amount_cents: commissionAmount,
      status: 'pending',
      referred_at: new Date().toISOString()
    });

    // Update Affiliate Account
    await base44.asServiceRole.entities.AffiliateAccount.update(affiliate.id, {
      total_referrals: (affiliate.total_referrals || 0) + 1,
      pending_balance_cents: (affiliate.pending_balance_cents || 0) + commissionAmount
    });

    // Sende Benachrichtigung
    await base44.integrations.Core.SendEmail({
      to: affiliate.user_email,
      subject: 'Neue Provision verdient! 💰',
      body: `
Glückwunsch! Du hast eine neue Provision verdient.

Betrag: €${(commissionAmount / 100).toFixed(2)}
Vermittelter Benutzer: ${referred_user_email}

Diese Provision wird hinzugefügt, sobald die Zahlung bestätigt wurde.

Dein aktueller Kontostand wird in deinem Affiliate-Dashboard angezeigt.

Viele Grüße,
Dein FinTuttO Team
      `
    });

    return Response.json({
      success: true,
      commission: {
        id: commission.id,
        amount_cents: commissionAmount,
        status: commission.status
      }
    });
  } catch (error) {
    console.error('Error tracking referral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});