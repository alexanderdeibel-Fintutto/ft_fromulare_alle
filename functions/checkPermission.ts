import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { required_permission } = await req.json();

    if (!required_permission) {
      return Response.json({ error: 'Missing required_permission' }, { status: 400 });
    }

    // Check user role assignments
    const roleAssignments = await base44.entities.UserRoleAssignment.filter({
      user_email: user.email,
    });

    if (roleAssignments.length === 0) {
      return Response.json({ has_permission: false });
    }

    // Check if any role has the required permission
    for (const assignment of roleAssignments) {
      const role = await base44.entities.PermissionRole.filter({
        id: assignment.role_id,
      });

      if (role.length > 0 && role[0].permissions?.includes(required_permission)) {
        return Response.json({ has_permission: true });
      }
    }

    return Response.json({ has_permission: false });
  } catch (error) {
    console.error('Error checking permission:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});