import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tasks } = await req.json();

    if (!tasks || !Array.isArray(tasks)) {
      return Response.json({ error: 'tasks array required' }, { status: 400 });
    }

    // Check if batch processing is enabled
    const settings = await base44.asServiceRole.entities.AISettings.list();
    const aiSettings = settings?.[0];
    
    if (!aiSettings?.enable_batch_processing) {
      return Response.json({ 
        error: 'Batch processing ist nicht aktiviert' 
      }, { status: 403 });
    }

    // Process tasks sequentially (in production, use queue)
    const results = [];
    
    for (const task of tasks) {
      try {
        const result = await base44.functions.invoke('aiCoreService', {
          action: task.action || 'chat',
          prompt: task.prompt,
          systemPrompt: task.systemPrompt,
          userId: user.email,
          featureKey: task.featureKey || 'batch',
          maxTokens: task.maxTokens || 512,
          metadata: { batch_id: task.id }
        });

        results.push({
          task_id: task.id,
          success: result.success,
          content: result.content,
          usage: result.usage
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          task_id: task.id,
          success: false,
          error: error.message
        });
      }
    }

    // Calculate totals
    const totals = results.reduce((acc, r) => ({
      success_count: acc.success_count + (r.success ? 1 : 0),
      total_cost: acc.total_cost + (r.usage?.cost_eur || 0),
      total_tokens: acc.total_tokens + (r.usage?.input_tokens || 0) + (r.usage?.output_tokens || 0)
    }), { success_count: 0, total_cost: 0, total_tokens: 0 });

    return Response.json({
      success: true,
      processed: tasks.length,
      results,
      totals
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});