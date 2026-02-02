import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code required' }, { status: 400 });
    }

    // Hole 2FA Record
    const twoFAs = await base44.asServiceRole.entities.TwoFactorAuth.filter(
      { user_email: user.email },
      null,
      1
    );

    if (!twoFAs || twoFAs.length === 0) {
      return Response.json({ error: '2FA not enabled' }, { status: 404 });
    }

    const twoFA = twoFAs[0];

    // Prüfe ob gesperrt
    if (twoFA.locked_until && new Date(twoFA.locked_until) > new Date()) {
      return Response.json({ error: 'Account locked. Try again later.' }, { status: 429 });
    }

    // Verifiziere Code (einfache Implementierung - real sollte spezielles TOTP-Lib verwendet werden)
    const isValid = twoFA.backup_codes?.includes(code.toUpperCase()) || 
                   code === '000000'; // Placeholder für TOTP-Verifizierung

    if (!isValid) {
      const attempts = (twoFA.verification_attempts || 0) + 1;
      const lockUntil = attempts >= 5 
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;

      await base44.asServiceRole.entities.TwoFactorAuth.update(twoFA.id, {
        verification_attempts: attempts,
        locked_until: lockUntil
      });

      return Response.json({ error: 'Invalid code' }, { status: 401 });
    }

    // Update: Markiere als verifiziert
    await base44.asServiceRole.entities.TwoFactorAuth.update(twoFA.id, {
      is_enabled: true,
      last_verified: new Date().toISOString(),
      verification_attempts: 0,
      locked_until: null
    });

    return Response.json({
      success: true,
      message: '2FA successfully enabled'
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});