import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { app_name, category, description, repository_url } = body;

    if (!app_name || !category) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const app = await base44.entities.MarketplaceApp.create({
      developer_email: user.email,
      app_name,
      category,
      description,
      version: '1.0.0',
      repository_url,
      is_published: true
    });

    return Response.json({
      success: true,
      app_id: app.id
    });
  } catch (error) {
    console.error('App publishing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});