import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, exemption_data } = await req.json();

    if (action === 'apply') {
      const exemption = await base44.entities.TaxExemption.create({
        customer_email: user.email,
        ...exemption_data,
        status: 'pending_verification',
        effective_date: new Date().toISOString().split('T')[0]
      });

      return Response.json({
        success: true,
        exemption_id: exemption.id,
        message: 'Tax exemption submitted for verification'
      });
    }

    if (action === 'verify') {
      const { exemption_id } = await req.json();

      if (user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }

      await base44.asServiceRole.entities.TaxExemption.update(exemption_id, {
        status: 'verified',
        verified_by: user.email
      });

      return Response.json({
        success: true,
        message: 'Tax exemption verified'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing tax exemption:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});