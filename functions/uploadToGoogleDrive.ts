import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileContent, folderId } = await req.json();

    if (!fileName || !fileContent) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get Google Drive access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Create file metadata
    const metadata = {
      name: fileName,
      mimeType: 'application/pdf',
      ...(folderId && { parents: [folderId] })
    };

    // Create multipart body
    const boundary = '===============7330845974216740156==';
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/octet-stream',
      '',
      fileContent,
      `--${boundary}--`
    ].join('\n');

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body
    });

    if (!uploadRes.ok) {
      throw new Error(`Google Drive upload failed: ${uploadRes.statusText}`);
    }

    const fileData = await uploadRes.json();

    // Log sync
    await base44.asServiceRole.entities.IntegrationConfig.filter({
      user_email: user.email,
      integration_type: 'google_drive'
    }).then(configs => {
      if (configs.length > 0) {
        base44.asServiceRole.entities.IntegrationConfig.update(configs[0].id, {
          last_sync: new Date().toISOString()
        });
      }
    });

    return Response.json({
      success: true,
      fileId: fileData.id,
      fileName: fileData.name,
      webViewLink: fileData.webViewLink
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});