import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { item_type, title, description, category, price_cents, file_url } = body;

    if (!item_type || !title || !category) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    let item;
    if (item_type === 'template') {
      item = await base44.entities.MarketplaceTemplate.create({
        creator_email: user.email,
        title,
        description,
        category,
        price_cents: price_cents || 0,
        template_file_url: file_url,
        commission_percent: 30,
        is_published: true
      });
    } else if (item_type === 'plugin') {
      item = await base44.entities.MarketplacePlugin.create({
        creator_email: user.email,
        name: title,
        description,
        category,
        version: '1.0.0',
        plugin_url: file_url,
        price_cents: price_cents || 0,
        commission_percent: 30,
        is_published: true
      });
    }

    // Create earnings record
    await base44.asServiceRole.entities.CreatorEarnings.create({
      creator_email: user.email,
      item_id: item.id,
      item_type,
      total_earnings_cents: 0,
      pending_earnings_cents: 0
    });

    return Response.json({
      success: true,
      item_id: item.id
    });
  } catch (error) {
    console.error('Publish error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});