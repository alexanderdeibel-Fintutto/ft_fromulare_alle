import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspace_id, member_email, role } = body;

    if (!workspace_id || !member_email) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const workspace = await base44.asServiceRole.entities.TeamSpace.get(workspace_id);
    if (!workspace || workspace.owner_email !== user.email) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    const members = workspace.members || [];
    if (!members.includes(member_email)) {
      members.push(member_email);
    }

    await base44.asServiceRole.entities.TeamSpace.update(workspace_id, {
      members
    });

    // Send invitation email
    await base44.integrations.Core.SendEmail({
      to: member_email,
      subject: `Einladung zu Team: ${workspace.workspace_name}`,
      body: `${user.full_name} hat dich zum Team "${workspace.workspace_name}" eingeladen.`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Invite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});