import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contract_id } = body;

    if (!contract_id) {
      return Response.json({ error: 'Missing contract_id' }, { status: 400 });
    }

    const contract = await base44.asServiceRole.entities.EnterpriseContract.get(contract_id);
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const signed_by = contract.signed_by || [];
    if (!signed_by.includes(user.email)) {
      signed_by.push(user.email);
    }

    await base44.asServiceRole.entities.EnterpriseContract.update(contract_id, {
      signed_by,
      status: signed_by.length > 0 ? 'active' : 'draft'
    });

    return Response.json({
      success: true,
      message: 'Contract signed'
    });
  } catch (error) {
    console.error('Contract signing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});