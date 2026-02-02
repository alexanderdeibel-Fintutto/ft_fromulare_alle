import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspace_name, description, billing_email } = body;

    if (!workspace_name) {
      return Response.json({ error: 'Missing workspace_name' }, { status: 400 });
    }

    const workspace = await base44.asServiceRole.entities.TeamSpace.create({
      workspace_name,
      owner_email: user.email,
      description,
      billing_email: billing_email || user.email,
      members: [user.email],
      admin_emails: [user.email],
      plan: 'free',
      is_active: true
    });

    return Response.json({ success: true, workspace_id: workspace.id });
  } catch (error) {
    console.error('Team space creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});