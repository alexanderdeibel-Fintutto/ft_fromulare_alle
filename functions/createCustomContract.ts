import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      contract_name,
      contract_type,
      content,
      effective_date,
      expiry_date,
      signature_required
    } = body;

    if (!contract_name || !content) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const contract = await base44.asServiceRole.entities.EnterpriseContract.create({
      organization_email: user.email,
      contract_name,
      contract_type: contract_type || 'custom',
      version: '1.0.0',
      content,
      effective_date,
      expiry_date,
      signature_required: signature_required !== false,
      status: 'draft'
    });

    return Response.json({
      success: true,
      contract_id: contract.id
    });
  } catch (error) {
    console.error('Contract creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});