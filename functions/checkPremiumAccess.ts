import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { module_id } = await req.json();

        if (!module_id) {
            return Response.json({ error: 'module_id required' }, { status: 400 });
        }

        // Prüfe: Hat User aktives Vermietify-Abo?
        const subscriptions = await base44.entities.Subscription.filter({
            user_email: user.email,
            status: 'active'
        });

        if (subscriptions && subscriptions.length > 0) {
            return Response.json({
                hasAccess: true,
                accessType: 'subscription',
                expiresAt: subscriptions[0].current_period_end,
                purchasedAt: subscriptions[0].created_date
            });
        }

        // Prüfe: Hat User Premium-Bundle gekauft?
        const bundle = await base44.entities.TemplatePurchase.filter({
            user_email: user.email,
            package_type: 'pack_all',
            status: 'completed'
        });

        if (bundle && bundle.length > 0) {
            return Response.json({
                hasAccess: true,
                accessType: 'bundle',
                expiresAt: null,
                purchasedAt: bundle[0].created_date
            });
        }

        // Prüfe: Hat User dieses spezifische Modul gekauft?
        const singlePurchase = await base44.entities.TemplatePurchase.filter({
            user_email: user.email,
            package_type: 'single',
            status: 'completed'
        });

        if (singlePurchase && singlePurchase.length > 0) {
            return Response.json({
                hasAccess: true,
                accessType: 'single',
                expiresAt: null,
                purchasedAt: singlePurchase[0].created_date
            });
        }

        // Kein Zugang
        return Response.json({
            hasAccess: false,
            accessType: 'none',
            expiresAt: null,
            purchasedAt: null
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});