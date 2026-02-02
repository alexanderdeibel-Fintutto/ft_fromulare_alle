import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PAYPAL_API = Deno.env.get('PAYPAL_MODE') === 'sandbox'
  ? 'https://api.sandbox.paypal.com'
  : 'https://api.paypal.com';

const SUBSCRIPTION_TIERS = {
  monthly: { price: '12.99', interval: 'MONTH', description: 'Monatliches Vorlagen-Abo' },
  annual: { price: '119.90', interval: 'YEAR', description: 'Jährliches Vorlagen-Abo' }
};

async function getPayPalAccessToken() {
  const auth = btoa(`${Deno.env.get('PAYPAL_CLIENT_ID')}:${Deno.env.get('PAYPAL_SECRET')}`);

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { tier, billingInfo, total_cents, tax_rate } = await req.json();

    if (!tier || !billingInfo || !SUBSCRIPTION_TIERS[tier]) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const tierData = SUBSCRIPTION_TIERS[tier];
    const accessToken = await getPayPalAccessToken();

    // Create PayPal plan
    const planResponse = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: 'PROD-TEMPLATES',
        name: tierData.description,
        description: tierData.description,
        type: 'REGULAR',
        payment_preferences: {
          service_type: 'PREPAID',
          setup_fee: {
            currency_code: 'EUR',
            value: '0.00'
          },
          payment_failure_threshold: 3
        },
        billing_cycles: [
          {
            frequency: {
              interval_unit: tierData.interval,
              interval_count: 1
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                currency_code: 'EUR',
                value: tierData.price
              }
            }
          }
        ]
      })
    });

    if (!planResponse.ok) {
      throw new Error(`PayPal plan creation failed: ${planResponse.status}`);
    }

    const plan = await planResponse.json();
    const planId = plan.id;

    // Create subscription
    const subscriptionResponse = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_id: planId,
        start_time: new Date().toISOString(),
        subscriber: {
          name: {
            given_name: billingInfo.full_name.split(' ')[0],
            surname: billingInfo.full_name.split(' ').slice(1).join(' ')
          },
          email_address: billingInfo.email,
          address: {
            address_line_1: billingInfo.address,
            admin_area_2: billingInfo.city,
            postal_code: billingInfo.zip,
            country_code: billingInfo.country
          }
        },
        application_context: {
          brand_name: 'FinTutto',
          locale: 'de-DE',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${Deno.env.get('APP_URL')}/subscription-success?type=paypal`,
          cancel_url: `${Deno.env.get('APP_URL')}/formulas?cancel=true`
        },
        custom_id: billingInfo.email,
        metadata: {
          tier,
          customer_country: billingInfo.country,
          tax_rate
        }
      })
    });

    if (!subscriptionResponse.ok) {
      throw new Error(`PayPal subscription creation failed: ${subscriptionResponse.status}`);
    }

    const subscription = await subscriptionResponse.json();

    return Response.json({
      success: true,
      subscription_id: subscription.id,
      approval_url: subscription.links.find(l => l.rel === 'approve')?.href
    });
  } catch (error) {
    console.error('PayPal subscription error:', error);
    return Response.json(
      { error: error.message || 'PayPal subscription failed' },
      { status: 500 }
    );
  }
});