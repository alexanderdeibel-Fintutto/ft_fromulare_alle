import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data_type } = await req.json();

        // Sammle Daten basierend auf data_type
        let userData = {
            user: {
                email: user.email,
                full_name: user.full_name,
                created_at: user.created_date
            }
        };

        if (data_type === 'all' || data_type === 'documents') {
            const docs = await base44.asServiceRole.entities.GeneratedDocument.filter({
                user_email: user.email
            });
            userData.documents = docs;
        }

        if (data_type === 'all' || data_type === 'analytics') {
            const analytics = await base44.asServiceRole.entities.APIUsage.filter({
                user_email: user.email
            });
            userData.analytics = analytics;
        }

        if (data_type === 'all' || data_type === 'settings') {
            const prefs = await base44.asServiceRole.entities.UserPreferences.filter({
                user_email: user.email
            });
            userData.preferences = prefs;
        }

        // Erstelle JSON-Datei
        const jsonData = JSON.stringify(userData, null, 2);

        // Speichere als File
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
            file: jsonData
        });

        // Aktualisiere DataDeletionRequest
        const requests = await base44.asServiceRole.entities.DataDeletionRequest.filter({
            user_email: user.email,
            request_type: 'export',
            status: 'processing'
        });

        if (requests.length > 0) {
            await base44.asServiceRole.entities.DataDeletionRequest.update(requests[0].id, {
                status: 'completed',
                file_url: uploadResult.file_url,
                completed_at: new Date().toISOString()
            });
        }

        // Sende Email
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: '📥 Dein Datenexport ist bereit',
            body: `Hallo,\n\ndein Datenexport ist bereit zum Download.\n\nDownload: ${uploadResult.file_url}\n\nDieser Link ist 30 Tage gültig.`
        });

        return Response.json({
            success: true,
            file_url: uploadResult.file_url
        });
    } catch (error) {
        console.error('Data export error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});