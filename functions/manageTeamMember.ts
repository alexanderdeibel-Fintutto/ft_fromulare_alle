import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, workspace_id, member_data } = await req.json();

    if (action === 'invite') {
      const member = await base44.entities.TeamMember.create({
        workspace_id,
        ...member_data,
        status: 'invited',
        invited_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        member_id: member.id,
        message: `Invitation sent to ${member_data.user_email}`
      });
    }

    if (action === 'update_role') {
      const { member_id, new_role } = await req.json();

      await base44.entities.TeamMember.update(member_id, {
        role: new_role
      });

      return Response.json({
        success: true,
        message: 'Role updated'
      });
    }

    if (action === 'remove') {
      const { member_id } = await req.json();

      await base44.entities.TeamMember.update(member_id, {
        status: 'inactive'
      });

      return Response.json({
        success: true,
        message: 'Team member removed'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing team member:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});