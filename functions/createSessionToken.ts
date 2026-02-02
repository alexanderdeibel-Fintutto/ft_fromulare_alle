import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { device_name, device_type } = body;

    // Generate token
    const token = `session_${crypto.randomUUID()}`;
    const token_hash = createHash('sha256').update(token).digest('hex');

    // Calculate expiration (30 days)
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30);

    const session = await base44.entities.SessionToken.create({
      user_email: user.email,
      token_hash,
      device_name: device_name || 'Unknown',
      device_type: device_type || 'desktop',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      last_activity: new Date().toISOString(),
      expires_at: expires_at.toISOString(),
      is_revoked: false
    });

    return Response.json({
      success: true,
      token,
      session_id: session.id,
      expires_at
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});