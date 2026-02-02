import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { share_id } = body;

    if (!share_id) {
      return Response.json({ error: 'Missing share_id' }, { status: 400 });
    }

    // Hole die Share
    const shares = await base44.asServiceRole.entities.DocumentShare.list();
    const share = shares.find(s => s.id === share_id);

    if (!share) {
      return Response.json({ error: 'Share not found' }, { status: 404 });
    }

    // Prüfe ob der User der Owner ist
    if (share.shared_by !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Lösche die Share
    await base44.asServiceRole.entities.DocumentShare.delete(share_id);

    return Response.json({
      success: true,
      message: 'Freigabe erfolgreich widerrufen'
    });
  } catch (error) {
    console.error('Revoke error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});