import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileContent, folderPath } = await req.json();
    const accessToken = Deno.env.get('DROPBOX_ACCESS_TOKEN');

    if (!accessToken) {
      return Response.json({ error: 'Dropbox not configured' }, { status: 400 });
    }

    if (!fileName || !fileContent) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const path = folderPath ? `${folderPath}/${fileName}` : `/${fileName}`;

    const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'add',
          autorename: true,
          mute: false
        })
      },
      body: fileContent
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      throw new Error(`Dropbox upload failed: ${error}`);
    }

    const fileData = await uploadRes.json();

    // Log sync
    await base44.asServiceRole.entities.IntegrationConfig.filter({
      user_email: user.email,
      integration_type: 'dropbox'
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
      pathLower: fileData.path_lower
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});