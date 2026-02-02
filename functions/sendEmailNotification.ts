import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

/**
 * Send email notification
 * Sends transactional emails via Brevo
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!BREVO_API_KEY) {
      return Response.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    let subject = '';
    let htmlContent = '';

    // Build email based on type
    switch (type) {
      case 'test':
        subject = 'Test-E-Mail von FinTutto';
        htmlContent = `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <div style="max-width: 600px; margin: 0 auto;">
                <h2>Test-E-Mail</h2>
                <p>Dies ist eine Test-E-Mail von FinTutto Hub.</p>
                <p style="color: #666; font-size: 12px;">
                  Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.
                </p>
              </div>
            </body>
          </html>
        `;
        break;

      case 'task_assigned':
        const taskData = await req.json();
        subject = `Neue Aufgabe zugewiesen: ${taskData.taskTitle}`;
        htmlContent = `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <div style="max-width: 600px; margin: 0 auto;">
                <h2>Neue Aufgabe zugewiesen</h2>
                <p><strong>${taskData.taskTitle}</strong></p>
                ${taskData.description ? `<p>${taskData.description}</p>` : ''}
                ${taskData.dueDate ? `<p><strong>Fällig am:</strong> ${taskData.dueDate}</p>` : ''}
                <p style="margin-top: 20px;">
                  <a href="${taskData.taskUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Aufgabe anzeigen
                  </a>
                </p>
              </div>
            </body>
          </html>
        `;
        break;

      case 'new_message':
        const messageData = await req.json();
        subject = `Neue Nachricht von ${messageData.senderName}`;
        htmlContent = `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <div style="max-width: 600px; margin: 0 auto;">
                <h2>Neue Nachricht</h2>
                <p><strong>Von:</strong> ${messageData.senderName}</p>
                <p><strong>Nachricht:</strong></p>
                <p style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #4F46E5;">
                  ${messageData.messagePreview}
                </p>
                <p style="margin-top: 20px;">
                  <a href="${messageData.messageUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Nachricht anzeigen
                  </a>
                </p>
              </div>
            </body>
          </html>
        `;
        break;

      default:
        return Response.json({ error: 'Unknown email type' }, { status: 400 });
    }

    // Send email via Brevo
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [{ email: userEmail }],
        sender: { name: 'FinTutto Hub', email: 'noreply@fintutto.de' },
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Brevo error:', error);
      return Response.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    const result = await response.json();

    return Response.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});