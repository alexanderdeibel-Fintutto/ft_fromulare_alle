Deno.serve(async (req) => {
    try {
        const { to, subject, htmlContent, senderName, senderEmail } = await req.json();
        
        const brevoApiKey = Deno.env.get('BREVO_API_KEY');
        if (!brevoApiKey) {
            throw new Error('BREVO_API_KEY not set');
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': brevoApiKey
            },
            body: JSON.stringify({
                sender: {
                    name: senderName || 'FinTuttO',
                    email: senderEmail || 'noreply@fintutto.de'
                },
                to: Array.isArray(to) ? to : [{ email: to }],
                subject,
                htmlContent
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send email');
        }

        const result = await response.json();
        return Response.json({ success: true, messageId: result.messageId });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});