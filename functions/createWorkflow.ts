import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, trigger_type, actions, conditions } = body;

    if (!name || !trigger_type || !actions) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const workflow = await base44.entities.WorkflowAutomation.create({
      user_email: user.email,
      name,
      trigger_type,
      actions,
      conditions: conditions || [],
      is_active: true,
      execution_count: 0
    });

    return Response.json({
      success: true,
      workflow_id: workflow.id
    });
  } catch (error) {
    console.error('Workflow creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});