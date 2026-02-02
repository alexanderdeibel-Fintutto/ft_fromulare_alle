import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commission_rate = 20, payout_method = 'bank_transfer' } = await req.json();

    // Generate unique affiliate code
    const affiliateCode = 'AFF_' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const account = await base44.entities.AffiliateAccount.create({
      user_email: user.email,
      affiliate_code: affiliateCode,
      status: 'pending',
      commission_rate_percent: commission_rate,
      payout_method
    });

    return Response.json({
      success: true,
      affiliate_id: account.id,
      affiliate_code: affiliateCode,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating affiliate account:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});