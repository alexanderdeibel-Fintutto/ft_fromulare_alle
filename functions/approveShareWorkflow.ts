import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workflow_id, approve, reason } = body;

    if (!workflow_id || approve === undefined) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const workflow = await base44.entities.ShareApprovalWorkflow.get(workflow_id);
    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!workflow.approvers.includes(user.email)) {
      return Response.json({ error: 'Not an approver' }, { status: 403 });
    }

    const approvals = workflow.approvals || {};
    approvals[user.email] = { approved: approve, timestamp: new Date().toISOString(), reason };

    const allApproved = Object.values(approvals).every(a => a.approved);
    const anyRejected = Object.values(approvals).some(a => !a.approved);

    let newStatus = 'pending';
    if (anyRejected) {
      newStatus = 'rejected';
    } else if (allApproved) {
      newStatus = 'approved';
    }

    await base44.entities.ShareApprovalWorkflow.update(workflow_id, {
      approvals,
      status: newStatus,
      rejection_reason: !approve ? reason : null
    });

    // Create share if approved
    if (newStatus === 'approved') {
      await base44.entities.DocumentShare.create({
        document_id: workflow.document_id,
        shared_with_email: workflow.recipient_email,
        access_level: workflow.access_level,
        shared_by: workflow.initiator_email,
        shared_at: new Date().toISOString()
      });
    }

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Approval error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});