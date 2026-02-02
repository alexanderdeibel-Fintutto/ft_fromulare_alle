import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { rates } = await req.json();

    let updatedCount = 0;

    for (const rateData of rates) {
      const { from_currency, to_currency, rate, spread_percent = 0 } = rateData;

      const existing = await base44.asServiceRole.entities.CurrencyExchangeRate.filter(
        {
          from_currency,
          to_currency,
          is_active: true
        },
        '-rate_date',
        1
      );

      const effectiveRate = rate * (1 + spread_percent / 100);

      if (existing && existing.length > 0) {
        // Update existing
        await base44.asServiceRole.entities.CurrencyExchangeRate.update(existing[0].id, {
          rate,
          effective_rate: effectiveRate,
          rate_date: new Date().toISOString().split('T')[0]
        });
      } else {
        // Create new
        await base44.asServiceRole.entities.CurrencyExchangeRate.create({
          from_currency,
          to_currency,
          rate,
          rate_date: new Date().toISOString().split('T')[0],
          effective_rate: effectiveRate,
          source: 'manual'
        });
      }

      updatedCount++;
    }

    return Response.json({
      success: true,
      updated_count: updatedCount
    });
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});