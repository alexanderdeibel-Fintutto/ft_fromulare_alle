import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { amount_cents, from_currency, to_currency } = await req.json();

    if (!amount_cents || !from_currency || !to_currency) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (from_currency === to_currency) {
      return Response.json({
        success: true,
        original_amount: amount_cents,
        original_currency: from_currency,
        converted_amount: amount_cents,
        target_currency: to_currency,
        rate: 1
      });
    }

    // Hole aktuelle Exchange Rates
    const rates = await base44.asServiceRole.entities.CurrencyExchangeRate.filter(
      { from_currency, to_currency, is_active: true },
      '-rate_date',
      1
    );

    if (!rates || rates.length === 0) {
      return Response.json({ error: 'Exchange rate not found' }, { status: 404 });
    }

    const rate = rates[0];
    const convertedAmount = Math.round(amount_cents * rate.rate);

    return Response.json({
      success: true,
      original_amount: amount_cents,
      original_currency: from_currency,
      converted_amount: convertedAmount,
      target_currency: to_currency,
      rate: rate.rate,
      rate_date: rate.rate_date
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});