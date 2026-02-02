import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hole alle Shares für diesen User über Base44 SDK
    const shares = await base44.entities.DocumentShare.filter(
      { shared_with_email: user.email }
    ) || [];

    // Filter aktive/nicht abgelaufene Shares
    const activeShares = shares.filter(s => 
      !s.expires_at || new Date(s.expires_at) > new Date()
    );

    // Gruppiere nach Source App
    const groupedByApp = {};
    activeShares.forEach(share => {
      const app = share.source_app || 'ft-formulare';
      if (!groupedByApp[app]) {
        groupedByApp[app] = [];
      }
      groupedByApp[app].push(share);
    });

    return Response.json({
      shared_documents: activeShares,
      grouped_by_app: groupedByApp,
      count: activeShares.length
    });
  } catch (error) {
    console.error('Get shared documents error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});