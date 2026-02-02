import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      endpoint_name,
      path,
      rate_limit_requests = 1000,
      rate_limit_window = 'hour',
      allowed_methods = ['GET', 'POST'],
      authentication_required = true
    } = body;

    if (!endpoint_name || !path) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const gateway = await base44.entities.APIGateway.create({
      user_email: user.email,
      endpoint_name,
      path,
      rate_limit_requests,
      rate_limit_window,
      allowed_methods,
      authentication_required,
      is_active: true
    });

    return Response.json({
      success: true,
      gateway_id: gateway.id
    });
  } catch (error) {
    console.error('Gateway config error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});