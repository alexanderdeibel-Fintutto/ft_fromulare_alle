import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document_id, custom_slug, access_level, expires_days, track_downloads } = body;

    if (!document_id || !custom_slug) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if slug already exists
    const existingSlugs = await base44.asServiceRole.entities.DocumentShare.filter({
      custom_slug: custom_slug
    });

    if (existingSlugs.length > 0) {
      return Response.json({ error: 'Slug already exists' }, { status: 409 });
    }

    let expires_at = null;
    if (expires_days && expires_days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + expires_days);
      expires_at = date.toISOString();
    }

    const share = await base44.entities.DocumentShare.create({
      document_id,
      custom_slug,
      access_level: access_level || 'download',
      shared_by: user.id,
      shared_at: new Date().toISOString(),
      expires_at,
      is_custom_link: true,
      track_downloads: track_downloads || false
    });

    return Response.json({
      success: true,
      share_id: share.id,
      custom_link: `/d/${custom_slug}`
    });
  } catch (error) {
    console.error('Create custom link error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});