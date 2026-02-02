import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { month = new Date().toISOString().slice(0, 7) } = body;

    const recommendations = [
      'Optimize unused storage',
      'Enable auto-scaling',
      'Review compute instances',
      'Implement CDN caching'
    ];

    const costAnalysis = await base44.entities.CostOptimization.create({
      user_email: user.email,
      month,
      total_cost: 1250.50,
      storage_cost: 450.00,
      compute_cost: 650.00,
      data_transfer_cost: 150.50,
      optimization_recommendations: recommendations
    });

    return Response.json({
      success: true,
      analysis_id: costAnalysis.id,
      recommendations
    });
  } catch (error) {
    console.error('Cost analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});