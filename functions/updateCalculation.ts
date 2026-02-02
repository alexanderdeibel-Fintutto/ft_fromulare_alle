import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { calculation_id, name, description, results } = body;

    if (!calculation_id) {
      return Response.json({ error: 'Missing calculation_id' }, { status: 400 });
    }

    const calc = await base44.entities.SavedCalculation.get(calculation_id);

    if (!calc || calc.user_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (results) updateData.results = results;

    await base44.entities.SavedCalculation.update(calculation_id, updateData);

    return Response.json({ success: true, message: 'Updated' });
  } catch (error) {
    console.error('Update calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});