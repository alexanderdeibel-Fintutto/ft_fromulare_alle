import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { slug, password } = await req.json();

    if (!slug) {
      return Response.json({ error: 'slug required' }, { status: 400 });
    }

    // Get public link
    const links = await base44.asServiceRole.entities.PublicLink.filter({
      link_slug: slug,
      is_active: true
    });

    if (links.length === 0) {
      return Response.json({ success: false, error: 'Link not found' }, { status: 404 });
    }

    const link = links[0];

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return Response.json({ success: false, error: 'Link expired' }, { status: 410 });
    }

    // Check password
    if (link.password) {
      if (!password) {
        return Response.json({ success: false, password_required: true }, { status: 401 });
      }
      if (password !== link.password) {
        return Response.json({ success: false, error: 'Incorrect password' }, { status: 403 });
      }
    }

    // Get document
    const document = await base44.asServiceRole.entities.GeneratedDocument.get(link.document_id);

    if (!document) {
      return Response.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Update access count
    await base44.asServiceRole.entities.PublicLink.update(link.id, {
      access_count: (link.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        document_type: document.document_type,
        file_url: document.file_url,
        created_date: document.created_date,
        created_by: document.created_by
      }
    });
  } catch (error) {
    console.error('Get public document error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to load document' },
      { status: 500 }
    );
  }
});