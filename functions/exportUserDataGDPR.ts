import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Collect all user data
    const documents = await base44.entities.DocumentShare.filter({
      shared_by: user.email
    });

    const shares = await base44.asServiceRole.entities.DocumentShare.filter({
      shared_with_email: user.email
    });

    const comments = await base44.asServiceRole.entities.ShareComment.filter({
      author_email: user.email
    });

    const notifications = await base44.asServiceRole.entities.ShareNotification.filter({
      user_email: user.email
    });

    const data = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_date: new Date().toISOString()
      },
      documents_shared: documents,
      shares_received: shares,
      comments: comments,
      notifications: notifications,
      exported_at: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = Buffer.from(json);

    // Save to file
    const fileName = `gdpr-export-${user.email}-${Date.now()}.json`;
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: blob
    });

    // Create compliance request record
    await base44.asServiceRole.entities.ComplianceDataRequest.create({
      user_email: user.email,
      request_type: 'gdpr_export',
      status: 'completed',
      export_url: file_url
    });

    return Response.json({ 
      success: true, 
      export_url: file_url,
      message: 'Daten exportiert'
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});