import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { ip_address } = body;

    if (!ip_address) {
      return Response.json({ error: 'Missing IP' }, { status: 400 });
    }

    // Check if IP whitelist is enabled
    const rules = await base44.asServiceRole.entities.IPWhitelistRule.filter({
      user_email: user.email,
      is_active: true
    });

    if (rules.length === 0) {
      // No whitelist = allow all
      return Response.json({ allowed: true, reason: 'No whitelist' });
    }

    // Check if IP matches any rule
    const allowed = rules.some(rule => {
      if (rule.ip_address === ip_address) return true;
      // Simple CIDR check
      if (rule.ip_address.includes('/')) {
        const [cidr] = rule.ip_address.split('/');
        return ip_address.startsWith(cidr.split('.').slice(0, 3).join('.'));
      }
      return false;
    });

    return Response.json({
      allowed,
      reason: allowed ? 'IP whitelisted' : 'IP not allowed'
    });
  } catch (error) {
    console.error('IP validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});