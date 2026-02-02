import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { method = 'totp' } = body;

    const twoFactor = await base44.entities.TwoFactorAuth.create({
      user_email: user.email,
      method,
      secret: Math.random().toString(36).substring(7),
      is_enabled: false,
      backup_codes: Array.from({length: 10}, () => Math.random().toString(36).substring(7))
    });

    return Response.json({
      success: true,
      twofa_id: twoFactor.id,
      secret: twoFactor.secret,
      backup_codes: twoFactor.backup_codes
    });
  } catch (error) {
    console.error('2FA error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});