import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return Response.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const session = await base44.entities.SessionToken.get(session_id);
    if (!session || session.user_email !== user.email) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    await base44.entities.SessionToken.update(session_id, {
      is_revoked: true
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Revoke session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});