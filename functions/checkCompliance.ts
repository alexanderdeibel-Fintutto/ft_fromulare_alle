import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { compliance_type = 'gdpr' } = body;

    const record = await base44.asServiceRole.entities.ComplianceRecord.create({
      organization_email: user.email,
      compliance_type,
      audit_date: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      findings: [],
      remediation_plan: ''
    });

    return Response.json({
      success: true,
      record_id: record.id
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});