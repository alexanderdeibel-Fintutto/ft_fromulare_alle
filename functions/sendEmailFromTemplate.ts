import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { template_id, recipient_email, variables } = await req.json();

        // Get the email template
        const template = await base44.asServiceRole.entities.EmailTemplate.get(template_id);
        if (!template) {
            return Response.json({ error: 'Template not found' }, { status: 404 });
        }

        // Replace variables in template
        let subject = template.subject;
        let htmlBody = template.html_body;

        if (variables) {
            Object.entries(variables).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                subject = subject.replace(regex, value);
                htmlBody = htmlBody.replace(regex, value);
            });
        }

        // Send email using Core integration
        await base44.integrations.Core.SendEmail({
            to: recipient_email,
            subject,
            body: htmlBody
        });

        // Log email notification
        await base44.asServiceRole.entities.EmailNotification.create({
            user_email: recipient_email,
            notification_type: template.template_type,
            subject,
            status: 'sent',
            sent_at: new Date().toISOString()
        });

        return Response.json({
            success: true,
            message: 'Email sent',
            recipient: recipient_email
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});