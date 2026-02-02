import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { amount_cents, user_country, user_eu_vat_id } = await req.json();

    if (!amount_cents || !user_country) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Hole VAT-Sätze
    const taxRates = await base44.asServiceRole.entities.TaxRate.filter(
      { country_code: user_country },
      null,
      1
    );

    let vatRate = 19; // Default DE

    if (taxRates && taxRates.length > 0) {
      vatRate = taxRates[0].vat_rate;
    }

    // B2B Exception: Wenn EU VAT ID vorhanden, keine VAT
    if (user_eu_vat_id) {
      return Response.json({
        net_amount: amount_cents,
        vat_amount: 0,
        gross_amount: amount_cents,
        vat_rate: 0,
        is_b2b: true,
        vat_id: user_eu_vat_id
      });
    }

    // B2C: VAT berechnen
    const vatAmount = Math.round(amount_cents * (vatRate / 100));
    const grossAmount = amount_cents + vatAmount;

    return Response.json({
      net_amount: amount_cents,
      vat_amount: vatAmount,
      gross_amount: grossAmount,
      vat_rate: vatRate,
      is_b2b: false,
      country: user_country
    });
  } catch (error) {
    console.error('Error calculating VAT:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});