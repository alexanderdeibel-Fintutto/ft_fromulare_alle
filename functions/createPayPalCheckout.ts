import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, templateSlug, templateName, packageType, billingInfo } = await req.json();

    if (!packageType || !billingInfo) {
      return Response.json({ error: 'packageType and billingInfo are required' }, { status: 400 });
    }

    // Determine pricing
    let subtotal = 0;
    let description = '';

    if (packageType === 'single') {
      subtotal = 499;
      description = `${templateName} - Einzelkauf`;
    } else if (packageType === 'pack_5') {
      subtotal = 990;
      description = '5er-Pack Vorlagen';
    } else if (packageType === 'pack_all') {
      subtotal = 2990;
      description = 'Alle Vorlagen - Unbegrenzter Zugriff';
    } else {
      return Response.json({ error: 'Invalid packageType' }, { status: 400 });
    }

    // Calculate VAT
    const vatResponse = await base44.functions.invoke('calculateVAT', {
      subtotal_cents: subtotal,
      customer_country: billingInfo.country,
      customer_tax_id: billingInfo.tax_id || null
    });

    const { tax_cents, total_cents } = vatResponse.data;

    // Create PayPal Order
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const secret = Deno.env.get('PAYPAL_SECRET');
    const mode = Deno.env.get('PAYPAL_MODE') || 'sandbox';
    const baseUrl = mode === 'live' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${secret}`)
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    if (!authData.access_token) {
      throw new Error('Failed to get PayPal access token');
    }

    // Create order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'EUR',
              value: (total_cents / 100).toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: 'EUR',
                  value: (subtotal / 100).toFixed(2)
                },
                tax_total: {
                  currency_code: 'EUR',
                  value: (tax_cents / 100).toFixed(2)
                }
              }
            },
            items: [
              {
                name: description,
                quantity: '1',
                unit_amount: {
                  currency_code: 'EUR',
                  value: (subtotal / 100).toFixed(2)
                },
                tax: {
                  currency_code: 'EUR',
                  value: (tax_cents / 100).toFixed(2)
                }
              }
            ],
            shipping: {
              name: {
                full_name: billingInfo.full_name
              },
              address: {
                address_line_1: billingInfo.address,
                admin_area_2: billingInfo.city,
                postal_code: billingInfo.zip,
                country_code: billingInfo.country
              }
            }
          }
        ],
        payer: {
          name: {
            given_name: billingInfo.full_name.split(' ')[0],
            surname: billingInfo.full_name.split(' ').slice(1).join(' ')
          },
          email_address: billingInfo.email
        },
        payment_source: {
          paypal: {
            experience_context: {
              return_url: `${new URL(req.url).origin}/?page=handlePayPalReturn`,
              cancel_url: `${new URL(req.url).origin}/?page=FormulareIndex`,
              payment_method_preference: 'UNRESTRICTED',
              brand_name: 'FinTutto Formulare',
              locale: 'de-DE'
            }
          }
        },
        custom_id: JSON.stringify({
          user_email: user.email,
          template_id: templateId,
          template_slug: templateSlug,
          template_name: templateName,
          package_type: packageType,
          billing_name: billingInfo.full_name,
          billing_email: billingInfo.email,
          billing_address: billingInfo.address,
          billing_zip: billingInfo.zip,
          billing_city: billingInfo.city,
          billing_country: billingInfo.country,
          billing_tax_id: billingInfo.tax_id || '',
          subtotal_cents: subtotal,
          tax_cents,
          total_cents
        })
      })
    });

    const orderData = await orderResponse.json();

    if (!orderData.id) {
      throw new Error('Failed to create PayPal order: ' + (orderData.message || 'Unknown error'));
    }

    // Find approval link
    const approvalLink = orderData.links.find(link => link.rel === 'approve');

    return Response.json({
      url: approvalLink.href,
      orderId: orderData.id
    });
  } catch (error) {
    console.error('PayPal checkout error:', error);
    return Response.json(
      { error: error.message || 'PayPal checkout failed' },
      { status: 500 }
    );
  }
});