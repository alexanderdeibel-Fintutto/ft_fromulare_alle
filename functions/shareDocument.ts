import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document_id, shared_with_email, access_level, expires_days } = body;

    if (!document_id || !shared_with_email || !access_level) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Berechne Ablaufdatum wenn angegeben
    let expires_at = null;
    if (expires_days && expires_days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + expires_days);
      expires_at = date.toISOString();
    }

    // Erstelle Share-Record
    const share = await base44.asServiceRole.entities.DocumentShare.create({
      document_id,
      shared_with_email,
      access_level,
      shared_by: user.id,
      expires_at
    });

    return Response.json({
      success: true,
      share_id: share.id,
      message: 'Dokument erfolgreich freigegeben'
    });
  } catch (error) {
    console.error('Share error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});