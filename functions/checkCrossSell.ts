import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const APP_ID = Deno.env.get('FINTUTTO_APP_ID') || 'default-app';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return Response.json({ success: true, recommendation: null });
    }

    const messageLower = message.toLowerCase();

    // Cross-Sell Triggers - Mapping für diese App
    const crossSellTriggers = [
      {
        from_app_id: APP_ID,
        to_app_id: 'ft_calc_nebenkostenabrechnung',
        trigger_keywords: ['nebenkost', 'abrechnung', 'betriebskosten', 'nebenkosten'],
        message_template: 'Für Nebenkostenabrechnungen empfehle ich unsere spezialisierte NK-Abrechnung App.',
        priority: 100,
      },
      {
        from_app_id: APP_ID,
        to_app_id: 'ft_form_mietvertrag',
        trigger_keywords: ['mietvertrag', 'miete', 'vermieten', 'mieter'],
        message_template: 'Du kannst auch professionelle Mietverträge mit unserer Template-App erstellen.',
        priority: 90,
      },
      {
        from_app_id: APP_ID,
        to_app_id: 'ft_mietrecht_assistent',
        trigger_keywords: ['mietrecht', 'mietgesetz', 'kündig', 'kaution', 'mietzins'],
        message_template: 'Für rechtliche Fragen empfehle ich unseren Mietrecht-Assistenten.',
        priority: 85,
      },
    ];

    // Prüfe ob Keywords matchen
    for (const trigger of crossSellTriggers.sort((a, b) => b.priority - a.priority)) {
      const hasMatch = trigger.trigger_keywords.some(kw =>
        messageLower.includes(kw.toLowerCase())
      );

      if (hasMatch) {
        return Response.json({
          success: true,
          recommendation: {
            toApp: trigger.to_app_id,
            message: trigger.message_template,
            priority: trigger.priority,
          },
        });
      }
    }

    return Response.json({ success: true, recommendation: null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});