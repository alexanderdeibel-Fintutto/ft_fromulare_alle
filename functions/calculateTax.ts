import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, amount_cents, customer_country, is_b2b = false } = await req.json();

    if (!amount_cents || !customer_country) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Hole Tax Configuration
    const configs = await base44.asServiceRole.entities.TaxConfiguration.filter(
      { user_email },
      null,
      1
    );

    const config = configs?.[0];

    // Hole Tax Rate für Land
    const taxRates = await base44.asServiceRole.entities.TaxRate.filter(
      { country_code: customer_country.toUpperCase() },
      null,
      1
    );

    const taxRate = taxRates?.[0];
    let taxAmount = 0;
    let taxRate_percent = 0;
    let note = '';

    if (!config?.eu_vat_enabled) {
      return Response.json({
        success: true,
        amount_cents,
        tax_amount_cents: 0,
        total_cents: amount_cents,
        tax_rate_percent: 0,
        note: 'VAT nicht aktiviert'
      });
    }

    // B2B Reverse Charge
    if (is_b2b && config?.reverse_charge_enabled) {
      note = 'Reverse Charge Mechanismus - Steuerschuldnerschaft des Leistungsempfängers';
      return Response.json({
        success: true,
        amount_cents,
        tax_amount_cents: 0,
        total_cents: amount_cents,
        tax_rate_percent: 0,
        note
      });
    }

    // Standard VAT
    if (taxRate) {
      taxRate_percent = taxRate.vat_rate;
      taxAmount = Math.round(amount_cents * (taxRate_percent / 100));
    } else if (config?.default_vat_rate) {
      taxRate_percent = config.default_vat_rate;
      taxAmount = Math.round(amount_cents * (taxRate_percent / 100));
    }

    return Response.json({
      success: true,
      amount_cents,
      tax_amount_cents: taxAmount,
      total_cents: amount_cents + taxAmount,
      tax_rate_percent: taxRate_percent,
      jurisdiction: config?.tax_jurisdiction || 'eu',
      is_reverse_charge: false
    });
  } catch (error) {
    console.error('Error calculating tax:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});