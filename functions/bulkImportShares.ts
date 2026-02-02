import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { shares_data } = body;

    if (!Array.isArray(shares_data)) {
      return Response.json({ error: 'shares_data must be an array' }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const share of shares_data) {
      try {
        if (!share.document_id || !share.shared_with_email) {
          results.failed++;
          results.errors.push(`Missing required fields for ${share.shared_with_email}`);
          continue;
        }

        await base44.entities.DocumentShare.create({
          document_id: share.document_id,
          shared_with_email: share.shared_with_email,
          access_level: share.access_level || 'download',
          shared_by: user.id,
          shared_at: new Date().toISOString(),
          expires_at: share.expires_at ? new Date(share.expires_at).toISOString() : null
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Error: ${err.message}`);
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error('Bulk import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});