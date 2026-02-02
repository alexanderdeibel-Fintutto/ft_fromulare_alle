import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { device_id, device_name, platform, app_version } = body;

    if (!device_id) {
      return Response.json({ error: 'Missing device_id' }, { status: 400 });
    }

    // Get or create device sync record
    const existing = await base44.asServiceRole.entities.DesktopSync.filter({
      user_email: user.email,
      device_id
    });

    if (existing.length > 0) {
      await base44.entities.DesktopSync.update(existing[0].id, {
        last_sync: new Date().toISOString()
      });
    } else {
      await base44.entities.DesktopSync.create({
        user_email: user.email,
        device_id,
        device_name,
        platform,
        app_version,
        last_sync: new Date().toISOString(),
        sync_enabled: true
      });
    }

    // Return documents to sync
    const shares = await base44.asServiceRole.entities.DocumentShare.filter({
      shared_with_email: user.email
    });

    return Response.json({
      success: true,
      documents: shares,
      sync_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Desktop sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});