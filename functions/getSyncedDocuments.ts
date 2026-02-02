import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, targetApp, propertyId, unitId, tenantId, contractId } = await req.json();

    if (!userEmail || !targetApp) {
      return Response.json({ error: 'userEmail and targetApp are required' }, { status: 400 });
    }

    // Build filter query
    const filter = {
      user_email: userEmail,
      shared_with_apps: targetApp
    };

    // Add context filters if provided
    if (propertyId) filter.property_id = propertyId;
    if (unitId) filter.unit_id = unitId;
    if (tenantId) filter.tenant_id = tenantId;
    if (contractId) filter.contract_id = contractId;

    // Fetch documents
    const documents = await base44.asServiceRole.entities.GeneratedDocument.filter(filter);

    return Response.json({
      success: true,
      documents: documents || [],
      count: documents?.length || 0
    });
  } catch (error) {
    console.error('Get synced documents error:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
});