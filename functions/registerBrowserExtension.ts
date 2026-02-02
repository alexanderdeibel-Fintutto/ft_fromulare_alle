import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { extension_id, browser, version, permissions } = body;

    if (!extension_id || !browser) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const config = await base44.entities.BrowserExtensionConfig.create({
      user_email: user.email,
      extension_id,
      browser,
      version,
      permissions: permissions || [],
      enabled: true,
      last_updated: new Date().toISOString(),
      settings: {
        quickCapture: true,
        shareNotifications: true,
        contextMenu: true
      }
    });

    return Response.json({
      success: true,
      config_id: config.id
    });
  } catch (error) {
    console.error('Extension registration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});