import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { device_id, device_name, platform, app_version, push_token } = body;

    if (!device_id || !platform) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.MobileDevice.filter({
      user_email: user.email,
      device_id
    });

    if (existing.length > 0) {
      await base44.entities.MobileDevice.update(existing[0].id, {
        push_token,
        last_active: new Date().toISOString()
      });
    } else {
      await base44.entities.MobileDevice.create({
        user_email: user.email,
        device_id,
        device_name,
        platform,
        app_version,
        push_token,
        last_active: new Date().toISOString(),
        offline_mode: false
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Mobile registration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});