import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { share_id, content, approval_required } = body;

    if (!share_id || !content) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const comment = await base44.entities.ShareComment.create({
      share_id,
      author_email: user.email,
      content,
      approval_required: approval_required || false,
      status: approval_required ? 'pending' : 'approved'
    });

    return Response.json({ success: true, comment_id: comment.id });
  } catch (error) {
    console.error('Add comment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});