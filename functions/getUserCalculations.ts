import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const calculations = await base44.entities.SavedCalculation.filter({
      user_email: user.email
    }, '-created_date', 100);

    return Response.json({
      success: true,
      calculations: calculations || [],
      total: calculations.length
    });
  } catch (error) {
    console.error('Get calculations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});