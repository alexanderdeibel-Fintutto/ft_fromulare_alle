import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'npm:crypto@1.0.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document_id, shared_with_email, access_level, password, expires_days } = body;

    if (!document_id || !shared_with_email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let expires_at = null;
    if (expires_days && expires_days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + expires_days);
      expires_at = date.toISOString();
    }

    // Hash password for security
    const passwordHash = createHash('sha256').update(password).digest('hex');

    const share = await base44.entities.DocumentShare.create({
      document_id,
      shared_with_email,
      access_level: access_level || 'download',
      shared_by: user.id,
      password: passwordHash,
      expires_at,
      shared_at: new Date().toISOString()
    });

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      action: 'share.created_with_password',
      resource_type: 'DocumentShare',
      resource_id: share.id,
      severity: 'info'
    });

    return Response.json({
      success: true,
      share_id: share.id,
      share_link: `/share/${share.id}`
    });
  } catch (error) {
    console.error('Create password share error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});