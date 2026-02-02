import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { statement_type = 'p_and_l', period = 'monthly' } = await req.json();

    // Hole alle Invoices
    const invoices = await base44.asServiceRole.entities.Invoice.filter(
      { status: 'paid' },
      null,
      5000
    );

    // Berechne Metriken
    const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.amount_cents || 0), 0);
    
    const operatingExpenses = (invoices || [])
      .filter(inv => inv.type === 'expense')
      .reduce((sum, inv) => sum + (inv.amount_cents || 0), 0);

    const grossProfit = totalRevenue - (totalRevenue * 0.15); // 15% COGS
    const operatingProfit = grossProfit - operatingExpenses;
    const netProfit = operatingProfit * 0.8; // 20% taxes

    const statement = await base44.asServiceRole.entities.FinancialStatement.create({
      statement_date: new Date().toISOString().split('T')[0],
      statement_type,
      period,
      revenue_cents: totalRevenue,
      cost_of_goods_sold_cents: Math.round(totalRevenue * 0.15),
      gross_profit_cents: Math.round(grossProfit),
      operating_expenses_cents: operatingExpenses,
      operating_profit_cents: Math.round(operatingProfit),
      net_profit_cents: Math.round(netProfit),
      assets_cents: totalRevenue * 2,
      liabilities_cents: totalRevenue * 0.5,
      equity_cents: totalRevenue * 1.5,
      cash_flow_operating_cents: Math.round(netProfit * 0.9),
      cash_flow_investing_cents: Math.round(-totalRevenue * 0.1),
      cash_flow_financing_cents: 0,
      net_cash_flow_cents: Math.round(netProfit * 0.8)
    });

    return Response.json({
      success: true,
      statement_id: statement.id,
      summary: {
        revenue: (totalRevenue / 100).toFixed(2),
        net_profit: (netProfit / 100).toFixed(2),
        profit_margin: ((netProfit / totalRevenue) * 100).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error generating financial statement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});