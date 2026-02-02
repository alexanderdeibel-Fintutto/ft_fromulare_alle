import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      brand_name,
      logo_url,
      primary_color = '#4F46E5',
      secondary_color = '#7C3AED',
      font_family = 'Inter'
    } = body;

    if (!brand_name) {
      return Response.json({ error: 'Missing brand_name' }, { status: 400 });
    }

    const portal = await base44.entities.BrandingPortal.create({
      user_email: user.email,
      brand_name,
      logo_url,
      primary_color,
      secondary_color,
      font_family,
      is_active: true
    });

    return Response.json({
      success: true,
      portal_id: portal.id
    });
  } catch (error) {
    console.error('Portal creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});