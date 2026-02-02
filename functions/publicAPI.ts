import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function verifyAPIKey(apiKey) {
  // In production, this would look up the key in the database
  // For now, we'll validate the format
  return apiKey && apiKey.length === 64;
}

async function checkRateLimit(keyId, base44) {
  const key = await base44.asServiceRole.entities.APIKey.get(keyId);
  
  if (!key || !key.is_active) {
    return { allowed: false, error: 'API key not found or inactive' };
  }

  // Check if quota reset
  const now = new Date();
  const lastReset = new Date(key.last_reset_at);
  const daysPassed = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

  let currentCount = key.requests_today;
  if (daysPassed >= 1) {
    currentCount = 0;
  }

  if (currentCount >= key.rate_limit) {
    return { 
      allowed: false, 
      error: 'Rate limit exceeded',
      remaining: 0 
    };
  }

  return { 
    allowed: true, 
    remaining: key.rate_limit - currentCount - 1 
  };
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Extract API key from header
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
      return Response.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    const base44 = createClientFromRequest(req);

    // Routes
    if (path === '/api/v1/documents' && method === 'GET') {
      // GET /api/v1/documents - List user's documents
      const limit = url.searchParams.get('limit') || '50';
      const offset = url.searchParams.get('offset') || '0';

      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const documents = await base44.entities.GeneratedDocument.filter(
        { user_email: user.email, is_deleted: false },
        '-created_date',
        parseInt(limit)
      );

      return Response.json({
        success: true,
        data: documents,
        count: documents.length
      });
    }

    if (path.match(/^\/api\/v1\/documents\/[^\/]+$/) && method === 'GET') {
      // GET /api/v1/documents/{id} - Get single document
      const docId = path.split('/')[4];
      
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const doc = await base44.entities.GeneratedDocument.get(docId);
      if (!doc || doc.user_email !== user.email) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }

      return Response.json({
        success: true,
        data: doc
      });
    }

    return Response.json(
      { error: 'Endpoint not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});