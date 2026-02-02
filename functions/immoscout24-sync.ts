import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();

    // Mock (ImmobilienScout24 benötigt OAuth1)
    switch (body.action) {
      case 'publish':
        const mockListingId = `IS24-${Date.now()}`;
        
        await base44.analytics.track({
          eventName: 'property_published',
          properties: { 
            property_id: body.property_id, 
            portal: 'immoscout24',
            app: body.app 
          }
        });

        return Response.json({
          success: true,
          action: 'published',
          portal_listing_id: mockListingId,
          listing_url: `https://www.immobilienscout24.de/expose/${mockListingId}`,
          hinweis: 'Mock-Antwort. Echte Integration benötigt ImmobilienScout24 OAuth1.'
        });

      case 'get_inquiries':
        await base44.analytics.track({
          eventName: 'inquiries_fetched',
          properties: { property_id: body.property_id, app: body.app }
        });

        return Response.json({
          success: true,
          inquiries_count: 7,
          hinweis: 'Mock-Antwort. Echte Anfragen kommen über ImmobilienScout24 API.'
        });

      default:
        throw new Error('Unbekannte Action');
    }

  } catch (error) {
    console.error('ImmobilienScout24 Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});