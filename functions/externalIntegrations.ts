import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();

    if (action === 'export_to_google_drive') {
      return await exportToGoogleDrive(base44, user, data);
    }
    
    if (action === 'export_to_dropbox') {
      return await exportToDropbox(base44, user, data);
    }
    
    if (action === 'send_to_slack') {
      return await sendToSlack(base44, user, data);
    }

    if (action === 'import_from_google_drive') {
      return await importFromGoogleDrive(base44, user, data);
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Integration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function exportToGoogleDrive(base44, user, data) {
  try {
    // Get access token for Google Drive
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Google Drive not connected. Please authorize in settings.' 
      }, { status: 403 });
    }

    // Create file content (CSV or JSON)
    const fileName = data.fileName || `ai-report-${new Date().toISOString().substring(0, 10)}.csv`;
    const content = data.content;
    const mimeType = data.mimeType || 'text/csv';

    // Upload to Google Drive
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: createMultipartBody(fileName, content, mimeType)
    });

    if (!uploadResponse.ok) {
      throw new Error(`Google Drive upload failed: ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    
    // Log the action
    await base44.entities.DataExport.create({
      user_email: user.email,
      export_type: 'ai_report',
      destination: 'google_drive',
      file_name: fileName,
      file_id: result.id,
      status: 'completed'
    });

    return Response.json({ 
      success: true, 
      fileId: result.id,
      webViewLink: result.webViewLink 
    });
  } catch (error) {
    console.error('Google Drive export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function exportToDropbox(base44, user, data) {
  try {
    const accessToken = Deno.env.get('DROPBOX_ACCESS_TOKEN');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Dropbox not configured' 
      }, { status: 403 });
    }

    const fileName = data.fileName || `ai-report-${new Date().toISOString().substring(0, 10)}.csv`;
    const content = data.content;

    const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: `/FinTutto/${fileName}`,
          mode: 'add',
          autorename: true
        }),
        'Content-Type': 'application/octet-stream'
      },
      body: content
    });

    if (!uploadResponse.ok) {
      throw new Error(`Dropbox upload failed: ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();

    // Log the action
    await base44.entities.DataExport.create({
      user_email: user.email,
      export_type: 'ai_report',
      destination: 'dropbox',
      file_name: fileName,
      status: 'completed'
    });

    return Response.json({ success: true, fileId: result.id });
  } catch (error) {
    console.error('Dropbox export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function sendToSlack(base44, user, data) {
  try {
    // Get Slack webhook or token from user's integration config
    const integrationConfig = await base44.entities.IntegrationConfig.filter({
      user_email: user.email,
      integration_type: 'slack'
    });

    if (!integrationConfig || integrationConfig.length === 0) {
      return Response.json({ 
        error: 'Slack not configured' 
      }, { status: 403 });
    }

    const webhookUrl = integrationConfig[0].config?.webhook_url;
    
    if (!webhookUrl) {
      return Response.json({ error: 'Slack webhook not found' }, { status: 400 });
    }

    const message = {
      text: data.title || 'AI Report',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: data.title || 'AI Usage Report'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: data.message || 'See details in FinTutto'
          }
        }
      ]
    };

    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!slackResponse.ok) {
      throw new Error(`Slack notification failed: ${slackResponse.statusText}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Slack send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function importFromGoogleDrive(base44, user, data) {
  try {
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Google Drive not connected' 
      }, { status: 403 });
    }

    // Download file from Google Drive
    const fileId = data.fileId;
    const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!downloadResponse.ok) {
      throw new Error(`Download failed: ${downloadResponse.statusText}`);
    }

    const fileContent = await downloadResponse.text();

    return Response.json({ 
      success: true,
      content: fileContent,
      fileId
    });
  } catch (error) {
    console.error('Google Drive import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function createMultipartBody(fileName, content, mimeType) {
  const boundary = '===============7330845974216740156==';
  const metadata = {
    name: fileName,
    mimeType: mimeType
  };

  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n--${boundary}--`;
  
  return body;
}