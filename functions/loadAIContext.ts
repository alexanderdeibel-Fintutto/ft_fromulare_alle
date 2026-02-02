import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const APP_ID = Deno.env.get('FINTUTTO_APP_ID') || 'default-app';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Für jetzt: Mock der Views bis sie in Supabase verfügbar sind
    // In Production würden diese direkten Zugriff auf Supabase haben
    const appContext = {
      app_id: APP_ID,
      app_name: 'FinTutto Hub',
      system_prompt: 'Du bist ein hilfreicher FinTutto KI-Assistent.',
      knowledge_scope: ['immobilien', 'mietrecht', 'nebenkosten'],
    };

    const personas = [
      {
        persona_id: 'vermieter_free',
        name: 'Vermieter (Free)',
        tone: 'friendly',
        formality: 'sie',
        upgrade_sensitivity: 'high',
      },
      {
        persona_id: 'vermieter_pro',
        name: 'Vermieter (Pro)',
        tone: 'professional',
        formality: 'sie',
        upgrade_sensitivity: 'low',
      },
      {
        persona_id: 'mieter',
        name: 'Mieter',
        tone: 'friendly',
        formality: 'du',
        upgrade_sensitivity: 'medium',
      },
    ];

    const systemPrompts = [
      {
        prompt_id: 'greeting',
        prompt: 'Begrüße den User freundlich und frag, wie du helfen kannst',
      },
      {
        prompt_id: 'upgrade_hint',
        prompt: 'Erwähne subtil, dass Premium-Features helfen könnten',
      },
    ];

    return Response.json({
      success: true,
      appContext,
      personas,
      systemPrompts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});