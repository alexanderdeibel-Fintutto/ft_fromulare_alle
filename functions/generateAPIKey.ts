import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key_name, permissions = ['read'], rate_limit = 1000 } = await req.json();

    // Generate API Key
    const apiKey = generateSecureKey();
    const keyHash = await hashKey(apiKey);
    const keyPreview = apiKey.slice(-4);

    const apiKeyRecord = await base44.entities.APIKey.create({
      user_email: user.email,
      key_name,
      key_hash: keyHash,
      key_preview: keyPreview,
      permissions,
      rate_limit,
      is_active: true
    });

    return Response.json({
      success: true,
      api_key: apiKey,
      key_id: apiKeyRecord.id,
      message: 'Speichere diesen Key sicher - er wird nicht mehr angezeigt'
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSecureKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'ft_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashKey(key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}