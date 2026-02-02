import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const FEATURE_TIERS = {
    free: ['basic_dashboard', 'profile'],
    starter: ['basic_dashboard', 'profile', 'analytics', 'export_csv'],
    pro: ['basic_dashboard', 'profile', 'analytics', 'export_csv', 'advanced_reports', 'api_access'],
    enterprise: ['basic_dashboard', 'profile', 'analytics', 'export_csv', 'advanced_reports', 'api_access', 'white_label', 'priority_support']
};

Deno.serve(async (req) => {
    try {
        const { customerId, feature } = await req.json();

        if (!customerId) {
            return Response.json({ 
                hasAccess: false, 
                tier: 'free',
                features: FEATURE_TIERS.free 
            });
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1
        });

        if (!subscriptions.data.length) {
            return Response.json({ 
                hasAccess: FEATURE_TIERS.free.includes(feature),
                tier: 'free',
                features: FEATURE_TIERS.free 
            });
        }

        const subscription = subscriptions.data[0];
        const product = await stripe.products.retrieve(subscription.items.data[0].price.product);
        const tier = product.metadata?.tier || 'free';

        const availableFeatures = FEATURE_TIERS[tier] || FEATURE_TIERS.free;
        const hasAccess = feature ? availableFeatures.includes(feature) : true;

        return Response.json({
            success: true,
            hasAccess,
            tier,
            features: availableFeatures,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                currentPeriodEnd: subscription.current_period_end
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});