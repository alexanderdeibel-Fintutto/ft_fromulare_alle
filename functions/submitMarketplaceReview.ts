import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { item_id, item_type, rating, title, comment } = body;

    if (!item_id || !item_type || !rating) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if user purchased item
    const transaction = await base44.asServiceRole.entities.MarketplaceTransaction.filter({
      buyer_email: user.email,
      item_id,
      item_type,
      status: 'completed'
    });

    const verified_purchase = transaction.length > 0;

    const review = await base44.entities.MarketplaceReview.create({
      item_id,
      item_type,
      reviewer_email: user.email,
      rating,
      title,
      comment,
      verified_purchase
    });

    // Update item rating
    const reviews = await base44.asServiceRole.entities.MarketplaceReview.filter({
      item_id,
      item_type
    });

    const avg_rating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    if (item_type === 'template') {
      const item = await base44.asServiceRole.entities.MarketplaceTemplate.get(item_id);
      await base44.asServiceRole.entities.MarketplaceTemplate.update(item_id, {
        rating: avg_rating,
        review_count: reviews.length
      });
    } else {
      await base44.asServiceRole.entities.MarketplacePlugin.update(item_id, {
        rating: avg_rating,
        review_count: reviews.length
      });
    }

    return Response.json({
      success: true,
      review_id: review.id
    });
  } catch (error) {
    console.error('Review error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});