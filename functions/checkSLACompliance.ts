import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Hole alle SLA Agreements
    const agreements = await base44.asServiceRole.entities.SLAAgreement.filter(
      { status: 'active' },
      null,
      1000
    );

    const results = [];

    for (const agreement of agreements || []) {
      // Simulate uptime calculation (würde echte Metriken verwenden)
      const currentUptime = 99.95;
      const meetsUptime = currentUptime >= agreement.uptime_guarantee_percent;

      // Check incidents
      const incidents = agreement.incidents_this_month || 0;
      const breached = !meetsUptime;

      let creditsToIssue = 0;

      if (breached) {
        // Berechne Gutschrift basierend auf Uptime Ausfallzeit
        const downtime = 100 - currentUptime;
        creditsToIssue = Math.ceil((downtime / 100) * (agreement.monthly_credit_percent || 10));
      }

      if (creditsToIssue > 0) {
        // Issue credits
        await base44.asServiceRole.entities.SLAAgreement.update(agreement.id, {
          credits_issued: (agreement.credits_issued || 0) + creditsToIssue
        });
      }

      results.push({
        customer_email: agreement.customer_email,
        sla_name: agreement.sla_name,
        current_uptime: currentUptime,
        guaranteed_uptime: agreement.uptime_guarantee_percent,
        compliant: meetsUptime,
        credits_issued: creditsToIssue
      });
    }

    return Response.json({
      success: true,
      agreements_checked: results.length,
      results
    });
  } catch (error) {
    console.error('Error checking SLA compliance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});