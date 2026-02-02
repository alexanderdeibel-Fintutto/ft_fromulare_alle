import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, resource_type, resource_id, changes, status = 'success', error_message } = await req.json();

    if (!action || !resource_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hole IP & User Agent
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') ||
                   'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Erstelle Audit Log
    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action,
      resource_type,
      resource_id: resource_id || '',
      changes: changes || {},
      ip_address: clientIP,
      user_agent: userAgent,
      status,
      error_message: error_message || null,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      audit_log_id: auditLog.id
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});