import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Sendet 2FA Code per Email
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generiere 6-stelligen Code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Speichere Code mit Ablaufzeit (5 Minuten)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Speichere in Preferences
        const prefs = await base44.asServiceRole.entities.UserPreferences.filter({
            user_email: user.email
        });

        if (prefs.length > 0) {
            await base44.asServiceRole.entities.UserPreferences.update(prefs[0].id, {
                two_fa_code: code,
                two_fa_expires_at: expiresAt.toISOString()
            });
        }

        // Sende Email
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: '🔐 Dein 2FA Authentifizierungscode',
            body: `Dein 2FA Code: ${code}\n\nGültig für 5 Minuten.`
        });

        return Response.json({
            success: true,
            message: '2FA Code wurde gesendet'
        });
    } catch (error) {
        console.error('2FA error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});