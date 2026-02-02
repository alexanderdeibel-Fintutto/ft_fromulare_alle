import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { document_id, recipient_email, approvers, access_level } = body;

    if (!document_id || !recipient_email || !approvers.length) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const workflow = await base44.asServiceRole.entities.ShareApprovalWorkflow.create({
      document_id,
      initiator_email: user.email,
      recipient_email,
      approvers,
      access_level: access_level || 'download',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Notify approvers
    for (const approver of approvers) {
      await base44.integrations.Core.SendEmail({
        to: approver,
        subject: 'Genehmigung erforderlich: Dokumentfreigabe',
        body: `Bitte genehmigen Sie die Freigabe von ${document_id} für ${recipient_email}`
      });
    }

    return Response.json({ success: true, workflow_id: workflow.id });
  } catch (error) {
    console.error('Workflow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});