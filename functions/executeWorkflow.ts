import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Execute Workflow
 * Executes a workflow definition with all its steps
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, trigger_event_type, trigger_event_id } = await req.json();

    if (!workflow_id || !trigger_event_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load workflow
    const workflow = await base44.entities.WorkflowDefinition.list();
    const workflowDef = workflow.find(w => w.id === workflow_id);

    if (!workflowDef) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!workflowDef.is_active) {
      return Response.json({ error: 'Workflow is inactive' }, { status: 400 });
    }

    // Create execution record
    const execution = await base44.entities.WorkflowExecution.create({
      workflow_id,
      user_email: user.email,
      trigger_event_type,
      trigger_event_id,
      status: 'running',
      started_at: new Date().toISOString(),
      execution_log: [],
      completed_steps: [],
      created_tasks: [],
      sent_notifications: [],
    });

    const executionLog = [];
    let currentStepId = workflowDef.steps[0]?.id;
    const createdTasks = [];
    const sentNotifications = [];

    // Execute steps
    while (currentStepId) {
      const step = workflowDef.steps.find(s => s.id === currentStepId);
      if (!step) break;

      try {
        let stepResult = null;

        // Execute step based on type
        switch (step.type) {
          case 'task':
            stepResult = await executeTaskStep(base44, user, step);
            if (stepResult.taskId) createdTasks.push(stepResult.taskId);
            break;

          case 'notification':
            stepResult = await executeNotificationStep(base44, user, step);
            if (stepResult.notificationId) sentNotifications.push(stepResult.notificationId);
            break;

          case 'email':
            stepResult = await executeEmailStep(base44, user, step);
            break;

          case 'delay':
            await new Promise(resolve =>
              setTimeout(resolve, (step.config.minutes || 0) * 60 * 1000)
            );
            stepResult = { success: true };
            break;

          case 'condition':
            // For now, always go to next_step_id (true branch)
            // In future: evaluate conditions
            stepResult = { success: true };
            break;

          default:
            stepResult = { success: true };
        }

        executionLog.push({
          timestamp: new Date().toISOString(),
          step_id: step.id,
          step_name: step.name,
          status: 'success',
          message: stepResult.message || 'Step executed',
        });

        // Move to next step
        currentStepId = step.next_step_id || null;
      } catch (error) {
        executionLog.push({
          timestamp: new Date().toISOString(),
          step_id: step.id,
          step_name: step.name,
          status: 'failed',
          message: error.message,
        });

        // Stop execution on error
        currentStepId = null;

        // Update execution as failed
        await base44.entities.WorkflowExecution.update(execution.id, {
          status: 'failed',
          error_message: error.message,
          execution_log: executionLog,
          completed_at: new Date().toISOString(),
        });

        return Response.json(
          { error: 'Workflow execution failed', details: error.message },
          { status: 500 }
        );
      }
    }

    // Update workflow and execution
    await base44.asServiceRole.entities.WorkflowDefinition.update(workflow_id, {
      execution_count: (workflowDef.execution_count || 0) + 1,
      last_executed: new Date().toISOString(),
    });

    await base44.entities.WorkflowExecution.update(execution.id, {
      status: 'success',
      execution_log: executionLog,
      created_tasks: createdTasks,
      sent_notifications: sentNotifications,
      completed_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      execution_id: execution.id,
      created_tasks: createdTasks,
      sent_notifications: sentNotifications,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

async function executeTaskStep(base44, user, step) {
  const taskData = {
    title: step.config.title || 'Workflow Task',
    description: step.config.description || '',
    priority: step.config.priority || 'medium',
    assigned_to: step.config.assigned_to || user.email,
  };

  const task = await base44.entities.Task.create(taskData);

  // Send notification
  try {
    await base44.functions.invoke('sendEmailNotification', {
      type: 'task_assigned',
      userEmail: taskData.assigned_to,
      taskTitle: taskData.title,
      taskUrl: `/TaskManagement?task=${task.id}`,
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }

  return { taskId: task.id, success: true };
}

async function executeNotificationStep(base44, user, step) {
  const notification = await base44.entities.Notification.create({
    user_email: user.email,
    title: step.name,
    message: step.config.message || '',
    type: 'info',
    is_read: false,
  });

  return { notificationId: notification.id, success: true };
}

async function executeEmailStep(base44, user, step) {
  try {
    await base44.functions.invoke('sendEmailNotification', {
      type: 'workflow_email',
      userEmail: step.config.recipient || user.email,
      subject: step.config.subject || 'Workflow Email',
      body: step.config.message || '',
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }

  return { success: true };
}