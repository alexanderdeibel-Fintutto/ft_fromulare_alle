import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { role_name, description, permissions, inherits_from } = body;

    if (!role_name || !permissions) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const role = await base44.asServiceRole.entities.PermissionRole.create({
      organization_email: user.email,
      role_name,
      description,
      permissions,
      inherits_from,
      is_builtin: false
    });

    return Response.json({
      success: true,
      role_id: role.id
    });
  } catch (error) {
    console.error('Role creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});