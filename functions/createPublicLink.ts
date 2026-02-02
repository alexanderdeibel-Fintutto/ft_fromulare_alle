import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function generateSlug() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, password, expiresInDays } = await req.json();

    if (!documentId) {
      return Response.json({ error: 'documentId required' }, { status: 400 });
    }

    // Verify document ownership
    const document = await base44.entities.GeneratedDocument.get(documentId);
    if (!document || document.user_email !== user.email) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const linkSlug = generateSlug();
    let expiresAt = null;

    if (expiresInDays) {
      const date = new Date();
      date.setDate(date.getDate() + expiresInDays);
      expiresAt = date.toISOString();
    }

    const link = await base44.entities.PublicLink.create({
      document_id: documentId,
      link_slug: linkSlug,
      password: password || null,
      created_by: user.email,
      access_count: 0,
      expires_at: expiresAt,
      is_active: true
    });

    const publicUrl = `${req.url.split('/functions')[0]}/public/document/${linkSlug}`;

    return Response.json({
      success: true,
      link_id: link.id,
      slug: linkSlug,
      public_url: publicUrl,
      expires_at: expiresAt
    });
  } catch (error) {
    console.error('Create public link error:', error);
    return Response.json(
      { error: error.message || 'Failed to create link' },
      { status: 500 }
    );
  }
});