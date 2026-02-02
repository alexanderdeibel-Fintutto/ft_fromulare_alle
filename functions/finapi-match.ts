import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Mock: Zahlungszuordnung mit KI
    const mockResults = [
      {
        transaction_id: 'TX-001',
        tenant_id: 'TENANT-123',
        confidence: 98,
        match_reason: 'Nachname gefunden, Betrag exakt, "Miete" im Verwendungszweck',
        auto_matched: true,
        suggested_action: 'auto_assign'
      },
      {
        transaction_id: 'TX-002',
        tenant_id: 'TENANT-456',
        confidence: 75,
        match_reason: 'Nachname gefunden, Betrag ~3% Abweichung',
        auto_matched: false,
        suggested_action: 'review',
        amount_deviation: 15.50
      },
      {
        transaction_id: 'TX-003',
        tenant_id: null,
        confidence: 20,
        match_reason: 'Kein Match gefunden',
        auto_matched: false,
        suggested_action: 'manual'
      }
    ];

    await base44.analytics.track({
      eventName: 'payments_matched',
      properties: { 
        total: mockResults.length, 
        auto_matched: mockResults.filter(r => r.auto_matched).length,
        app: 'vermietify' 
      }
    });

    return Response.json({
      success: true,
      total_transactions: mockResults.length,
      auto_matched: mockResults.filter(r => r.auto_matched).length,
      needs_review: mockResults.filter(r => r.suggested_action === 'review').length,
      manual_required: mockResults.filter(r => r.suggested_action === 'manual').length,
      results: mockResults,
      hinweis: 'Mock-Daten. Echte KI-Zuordnung benötigt Mieter- und Transaktionsdaten aus DB.'
    });

  } catch (error) {
    console.error('finAPI Match Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});