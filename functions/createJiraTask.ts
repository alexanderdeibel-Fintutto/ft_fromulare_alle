import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { summary, projectKey, issueType, description, assigneeId } = await req.json();
    const apiToken = Deno.env.get('JIRA_API_TOKEN');
    const jiraEmail = Deno.env.get('JIRA_EMAIL');
    const jiraBaseUrl = Deno.env.get('JIRA_BASE_URL');

    if (!apiToken || !jiraEmail || !jiraBaseUrl) {
      return Response.json({ error: 'Jira not configured' }, { status: 400 });
    }

    const issueData = {
      fields: {
        project: { key: projectKey },
        summary,
        issuetype: { name: issueType || 'Task' },
        ...(description && { description }),
        ...(assigneeId && { assignee: { id: assigneeId } })
      }
    };

    const auth = btoa(`${jiraEmail}:${apiToken}`);
    const createRes = await fetch(`${jiraBaseUrl}/rest/api/3/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issueData)
    });

    if (!createRes.ok) {
      const error = await createRes.json();
      throw new Error(`Jira issue creation failed: ${error.errorMessages?.[0] || 'Unknown error'}`);
    }

    const issueResponse = await createRes.json();

    // Log sync
    await base44.asServiceRole.entities.IntegrationConfig.filter({
      user_email: user.email,
      integration_type: 'jira'
    }).then(configs => {
      if (configs.length > 0) {
        base44.asServiceRole.entities.IntegrationConfig.update(configs[0].id, {
          last_sync: new Date().toISOString()
        });
      }
    });

    return Response.json({
      success: true,
      issueId: issueResponse.id,
      issueKey: issueResponse.key,
      issueUrl: `${jiraBaseUrl}/browse/${issueResponse.key}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});