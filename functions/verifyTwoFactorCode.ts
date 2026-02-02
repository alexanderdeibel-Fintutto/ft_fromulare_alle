import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Verifiziert 2FA Code
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { code } = await req.json();

        // Hole User Preferences
        const prefs = await base44.asServiceRole.entities.UserPreferences.filter({
            user_email: user.email
        });

        if (prefs.length === 0) {
            return Response.json({ error: '2FA nicht aktiviert' }, { status: 400 });
        }

        const pref = prefs[0];

        // Prüfe Code und Ablaufzeit
        if (pref.two_fa_code !== code) {
            return Response.json({ error: 'Falscher Code' }, { status: 400 });
        }

        if (new Date(pref.two_fa_expires_at) < new Date()) {
            return Response.json({ error: 'Code abgelaufen' }, { status: 400 });
        }

        // Lösche Code
        await base44.asServiceRole.entities.UserPreferences.update(pref.id, {
            two_fa_code: null,
            two_fa_expires_at: null
        });

        // Erstelle Session
        const session = await base44.asServiceRole.entities.UserSession.create({
            user_email: user.email,
            session_token: Math.random().toString(36).substring(7),
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent'),
            device_name: 'Verified Device',
            login_method: '2fa',
            is_active: true,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        return Response.json({
            success: true,
            session_id: session.id
        });
    } catch (error) {
        console.error('2FA verification error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});