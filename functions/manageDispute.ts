import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, dispute_data } = await req.json();

    if (action === 'create') {
      const dispute = await base44.entities.DisputeCase.create({
        user_email: user.email,
        ...dispute_data,
        status: 'new',
        created_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        dispute_id: dispute.id,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    if (action === 'submit_evidence') {
      const { dispute_id, evidence_urls } = await req.json();

      await base44.entities.DisputeCase.update(dispute_id, {
        evidence_submitted: true,
        evidence_urls,
        status: 'under_review'
      });

      return Response.json({
        success: true,
        message: 'Evidence submitted'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing dispute:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});