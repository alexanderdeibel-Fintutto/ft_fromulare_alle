import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { randomBytes } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { app_name, description, redirect_uris, scopes } = body;

    if (!app_name || !redirect_uris) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const client_id = `app_${randomBytes(16).toString('hex')}`;
    const client_secret = randomBytes(32).toString('hex');

    const app = await base44.entities.OAuthApp.create({
      user_email: user.email,
      app_name,
      description,
      client_id,
      client_secret,
      redirect_uris,
      scopes: scopes || ['documents.read'],
      is_active: true,
      created_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      app_id: app.id,
      client_id,
      client_secret,
      message: 'App created. Save client_secret securely!'
    });
  } catch (error) {
    console.error('OAuth app creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});