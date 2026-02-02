import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();

    // Mock-Antwort (finAPI benötigt OAuth2 User-Flow)
    switch (body.action) {
      case 'connect_bank':
        await base44.analytics.track({
          eventName: 'bank_connection_initiated',
          properties: { bank_id: body.bank_id, app: body.app }
        });

        return Response.json({
          success: true,
          action: 'redirect_to_webform',
          webform_url: 'https://webform.finapi.io/mock',
          webform_id: `WF-${Date.now()}`,
          hinweis: 'finAPI Integration erfordert OAuth2-Setup und Webform-Flow'
        });

      case 'sync_transactions':
        await base44.analytics.track({
          eventName: 'transactions_synced',
          properties: { account_id: body.account_id, app: body.app }
        });

        return Response.json({
          success: true,
          transactions_count: 42,
          unmatched_count: 3,
          hinweis: 'Mock-Daten. Echte Sync benötigt finAPI OAuth2.'
        });

      case 'get_balance':
        return Response.json({
          success: true,
          balance: 5432.10,
          currency: 'EUR',
          last_sync: new Date().toISOString(),
          hinweis: 'Mock-Daten'
        });

      default:
        throw new Error('Unbekannte Action');
    }

  } catch (error) {
    console.error('finAPI Sync Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});