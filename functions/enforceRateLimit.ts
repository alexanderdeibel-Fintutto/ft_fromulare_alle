import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { api_key_id } = await req.json();

    if (!api_key_id) {
      return Response.json({ error: 'Missing api_key_id' }, { status: 400 });
    }

    const now = new Date();
    const hourKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:00`;

    // Get or create rate limit record
    const limits = await base44.asServiceRole.entities.RateLimit.filter({
      api_key_id,
      hour: hourKey,
    });

    let limitRecord;
    if (limits.length > 0) {
      limitRecord = limits[0];
    } else {
      const apiKey = await base44.asServiceRole.entities.APIKey.filter({
        id: api_key_id,
      });
      
      limitRecord = await base44.asServiceRole.entities.RateLimit.create({
        api_key_id,
        hour: hourKey,
        request_count: 0,
        limit: apiKey[0]?.rate_limit || 1000,
      });
    }

    // Check if limit exceeded
    if (limitRecord.request_count >= limitRecord.limit) {
      return Response.json({
        allowed: false,
        remaining: 0,
        reset_at: new Date(new Date().getTime() + 3600000).toISOString(),
      }, { status: 429 });
    }

    // Increment counter
    await base44.asServiceRole.entities.RateLimit.update(limitRecord.id, {
      request_count: limitRecord.request_count + 1,
    });

    return Response.json({
      allowed: true,
      remaining: limitRecord.limit - (limitRecord.request_count + 1),
      reset_at: new Date(new Date().getTime() + 3600000).toISOString(),
    });
  } catch (error) {
    console.error('Error enforcing rate limit:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});