import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { comment_id, approved } = body;

    if (!comment_id || approved === undefined) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const comment = await base44.entities.ShareComment.get(comment_id);
    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 });
    }

    await base44.entities.ShareComment.update(comment_id, {
      status: approved ? 'approved' : 'rejected',
      approved_by: user.email,
      approved_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Approve comment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});