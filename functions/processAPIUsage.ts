import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      api_key_id,
      total_requests = 0,
      successful_requests = 0,
      average_response_time_ms = 0,
      data_transferred_bytes = 0
    } = await req.json();

    const today = new Date().toISOString().split('T')[0];
    const failed_requests = total_requests - successful_requests;
    const error_rate = total_requests > 0 ? (failed_requests / total_requests) * 100 : 0;

    const usage = await base44.entities.APIUsage.create({
      user_email: user.email,
      api_key_id,
      usage_date: today,
      total_requests,
      successful_requests,
      failed_requests,
      error_rate_percent: error_rate,
      average_response_time_ms,
      data_transferred_bytes,
      quota_usage_percent: (total_requests / 100000) * 100 // Example limit
    });

    return Response.json({
      success: true,
      usage_id: usage.id,
      error_rate: error_rate.toFixed(2)
    });
  } catch (error) {
    console.error('Error processing API usage:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});