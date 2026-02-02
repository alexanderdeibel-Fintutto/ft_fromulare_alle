import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, message, conversation_type, user_tier } = await req.json();

    if (!action || !message) {
      return Response.json({ error: 'action und message erforderlich' }, { status: 400 });
    }

    // Map legacy actions to new aiCoreService
    const actionMap = {
      'chat': 'chat',
      'analyze': 'analyze',
      'extract': 'ocr',
      'categorize': 'categorize'
    };

    const aiAction = actionMap[action] || 'chat';

    // Call aiCoreService
    const aiResponse = await base44.functions.invoke('aiCoreService', {
      action: aiAction,
      prompt: message,
      userId: user.email,
      featureKey: aiAction,
      metadata: {
        conversation_type: conversation_type || 'general',
        user_tier: user_tier || 'free'
      }
    });

    if (!aiResponse.success) {
      return Response.json(
        { error: aiResponse.error || 'KI-Service nicht verfügbar' },
        { status: 500 }
      );
    }

    // Return in legacy format for backwards compatibility
    return Response.json({
      response: aiResponse.content,
      usage: aiResponse.usage,
      success: true
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});