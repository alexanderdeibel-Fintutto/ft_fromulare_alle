import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { confirmed, reason } = body;

    if (!confirmed) {
      return Response.json({ error: 'Deletion must be confirmed' }, { status: 400 });
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    const request = await base44.asServiceRole.entities.ComplianceDataRequest.create({
      user_email: user.email,
      request_type: 'data_deletion',
      status: 'pending',
      deletion_confirmed: true,
      deletion_scheduled_at: deletionDate.toISOString(),
      reason
    });

    // Send confirmation email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Datenlöschungsanfrage bestätigt',
      body: `Deine Daten werden am ${deletionDate.toLocaleDateString('de-DE')} gelöscht.`
    });

    return Response.json({ 
      success: true, 
      request_id: request.id,
      deletion_date: deletionDate.toISOString()
    });
  } catch (error) {
    console.error('Deletion request error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});