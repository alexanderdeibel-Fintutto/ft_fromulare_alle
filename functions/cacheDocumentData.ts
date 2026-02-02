import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document_id, cache_type = 'memory', ttl = 3600 } = body;

    if (!document_id) {
      return Response.json({ error: 'Missing document_id' }, { status: 400 });
    }

    // Create cache config
    const config = await base44.asServiceRole.entities.CacheConfiguration.create({
      user_email: user.email,
      cache_type,
      ttl_seconds: ttl,
      enabled: true,
      cache_strategy: 'balanced'
    });

    return Response.json({
      success: true,
      cache_id: config.id,
      expires_in: ttl
    });
  } catch (error) {
    console.error('Cache error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});