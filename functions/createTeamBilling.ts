import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

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

    const { team_name, team_members, tier_name, billing_period, billing_email } = await req.json();

    if (!team_name || !team_members || !tier_name || !billing_period) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const memberCount = team_members.length;

    // Bestimme Preis
    const prices = {
      pack_5: { monthly: 2999, annual: 29990 },
      pack_all: { monthly: 9999, annual: 99990 }
    };

    const singlePrice = prices[tier_name]?.[billing_period];
    if (!singlePrice) {
      return Response.json({ error: 'Invalid tier or period' }, { status: 400 });
    }

    // Team-Rabatt: 10% pro Mitglied (max 30%)
    const discountPercentage = Math.min(memberCount * 10, 30);
    const totalAmount = Math.round(singlePrice * memberCount * (1 - discountPercentage / 100));
    const perMemberAmount = Math.round(totalAmount / memberCount);

    // Erstelle Stripe Subscription
    const stripeSubscription = await stripe.subscriptions.create({
      items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${team_name} - ${tier_name} Team`
            },
            recurring: {
              interval: billing_period === 'monthly' ? 'month' : 'year'
            },
            unit_amount: totalAmount
          }
        }
      ],
      metadata: {
        team_name,
        member_count: memberCount,
        tier_name
      }
    });

    // Berechne Daten
    const now = new Date();
    const nextBilling = new Date();
    if (billing_period === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    // Erstelle Team Billing Record
    const teamBilling = await base44.asServiceRole.entities.TeamBilling.create({
      team_name,
      team_lead_email: user.email,
      team_members: team_members.map(m => ({ email: m.email, role: m.role || 'member' })),
      billing_email: billing_email || user.email,
      tier_name,
      member_count: memberCount,
      total_amount_cents: totalAmount,
      amount_per_member_cents: perMemberAmount,
      billing_period,
      status: 'active',
      next_billing_date: nextBilling.toISOString().split('T')[0],
      stripe_subscription_id: stripeSubscription.id
    });

    // Sende Einladungen an Mitglieder
    for (const member of team_members) {
      await base44.integrations.Core.SendEmail({
        to: member.email,
        subject: `Einladung zu ${team_name} Team`,
        body: `
Du wurdest von ${user.full_name} eingeladen, dem Team "${team_name}" beizutreten!

Tier: ${tier_name}
Betrag pro Person: €${(perMemberAmount / 100).toFixed(2)}

Klicke hier, um die Einladung anzunehmen: https://example.com/team/accept

Viele Grüße,
Dein FinTuttO Team
        `
      });
    }

    return Response.json({
      success: true,
      team_billing: {
        id: teamBilling.id,
        team_name,
        member_count,
        total_amount_cents: totalAmount,
        discount_percentage: discountPercentage
      }
    });
  } catch (error) {
    console.error('Error creating team billing:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});