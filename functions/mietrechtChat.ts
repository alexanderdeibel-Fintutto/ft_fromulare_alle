import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, message, userType = 'unklar' } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    let chat = null;
    if (chatId) {
      chat = await base44.entities.MietrechtChat.get(chatId);
      if (!chat || chat.user_email !== user.email) {
        return Response.json({ error: 'Chat not found' }, { status: 404 });
      }
    }

    // Use aiCoreService for response
    const aiResponse = await base44.functions.invoke('aiCoreService', {
      action: 'chat',
      prompt: message,
      systemPrompt: `Du bist ein Mietrecht-Experte für deutsche Immobilienverwaltung.
Der User ist ein ${userType}.
Antworte präzise und praxisorientiert.
Beachte deutsches Mietrecht (BGB §§ 535ff).
Wenn der Fall komplex ist oder einen Anwalt benötigt, erwähne dies explizit.`,
      userId: user.email,
      featureKey: 'chat',
      conversationId: chatId
    });

    if (!aiResponse.success) {
      return Response.json({ error: aiResponse.error || 'AI-Service nicht verfügbar' }, { status: 500 });
    }

    const assistantMessage = aiResponse.content;

    // Create or update chat
    if (!chat) {
      const messages = [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() }
      ];

      chat = await base44.entities.MietrechtChat.create({
        user_email: user.email,
        user_type: userType,
        status: 'active',
        messages: messages,
        message_count: 2,
        last_message_at: new Date().toISOString(),
        topic: message.substring(0, 100),
        complexity: 'mittel',
        needs_lawyer: assistantMessage.toLowerCase().includes('anwalt')
      });
    } else {
      const messages = chat.messages || [];
      messages.push(
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() }
      );

      chat = await base44.entities.MietrechtChat.update(chatId, {
        messages: messages,
        message_count: messages.length,
        last_message_at: new Date().toISOString(),
        needs_lawyer: assistantMessage.toLowerCase().includes('anwalt')
      });
    }

    return Response.json({
      success: true,
      chat_id: chat.id,
      response: assistantMessage,
      needs_lawyer: assistantMessage.toLowerCase().includes('anwalt')
    });
  } catch (error) {
    console.error('Mietrecht chat error:', error);
    return Response.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
});