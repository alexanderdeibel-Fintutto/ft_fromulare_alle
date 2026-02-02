import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskName, projectId, description, dueDate, assigneeId } = await req.json();
    const apiToken = Deno.env.get('ASANA_API_TOKEN');

    if (!apiToken) {
      return Response.json({ error: 'Asana not configured' }, { status: 400 });
    }

    const taskData = {
      name: taskName,
      projects: [projectId],
      ...(description && { notes: description }),
      ...(dueDate && { due_on: dueDate }),
      ...(assigneeId && { assignee: assigneeId })
    };

    const createRes = await fetch('https://app.asana.com/api/1.0/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: taskData })
    });

    if (!createRes.ok) {
      const error = await createRes.json();
      throw new Error(`Asana task creation failed: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }

    const taskResponse = await createRes.json();

    // Log sync
    await base44.asServiceRole.entities.IntegrationConfig.filter({
      user_email: user.email,
      integration_type: 'asana'
    }).then(configs => {
      if (configs.length > 0) {
        base44.asServiceRole.entities.IntegrationConfig.update(configs[0].id, {
          last_sync: new Date().toISOString()
        });
      }
    });

    return Response.json({
      success: true,
      taskId: taskResponse.data.gid,
      taskName: taskResponse.data.name,
      taskUrl: taskResponse.data.permalink_url
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});