import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, workspace_name, workspace_type = 'personal' } = await req.json();

    if (action === 'create') {
      const workspace = await base44.entities.Workspace.create({
        workspace_name,
        owner_email: user.email,
        workspace_type,
        members: [{ email: user.email, role: 'owner' }],
        data_isolation_enabled: true
      });

      return Response.json({
        success: true,
        workspace_id: workspace.id,
        message: 'Workspace erstellt'
      });
    }

    if (action === 'add_member') {
      const { workspace_id, member_email, member_role = 'member' } = await req.json();

      const workspace = await base44.entities.Workspace.filter(
        { id: workspace_id },
        null,
        1
      );

      if (!workspace || workspace.length === 0) {
        return Response.json({ error: 'Workspace not found' }, { status: 404 });
      }

      const members = workspace[0].members || [];
      members.push({ email: member_email, role: member_role });

      await base44.entities.Workspace.update(workspace_id, { members });

      return Response.json({
        success: true,
        message: `${member_email} hinzugefügt`
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing workspace:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});