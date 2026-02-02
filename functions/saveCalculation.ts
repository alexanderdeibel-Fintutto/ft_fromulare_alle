import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, calculator_type, inputs, results, description } = body;

    if (!name || !calculator_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const calculation = await base44.entities.SavedCalculation.create({
      user_email: user.email,
      name,
      calculator_type,
      inputs,
      results,
      description: description || '',
      is_shared: false
    });

    return Response.json({
      success: true,
      calculation_id: calculation.id,
      message: 'Berechnung gespeichert'
    });
  } catch (error) {
    console.error('Save calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});