import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { from_currency, to_currency, amount_cents } = await req.json();

    // Get exchange rate
    const rates = await base44.entities.CurrencyExchangeRate.filter(
      {
        from_currency,
        to_currency,
        is_active: true
      },
      '-rate_date',
      1
    );

    if (!rates || rates.length === 0) {
      return Response.json({ error: 'Exchange rate not found' }, { status: 404 });
    }

    const rate = rates[0];
    const convertedAmount = Math.round(amount_cents * rate.effective_rate);

    return Response.json({
      success: true,
      from_currency,
      to_currency,
      original_amount: amount_cents / 100,
      converted_amount: convertedAmount / 100,
      rate: rate.effective_rate
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});