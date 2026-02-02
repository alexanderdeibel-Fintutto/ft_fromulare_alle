import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    try {
        const { action, customerId, priceId, email, successUrl, cancelUrl, subscriptionId } = await req.json();

        switch (action) {
            case 'createCheckoutSession':
                let customer;
                if (customerId) {
                    customer = customerId;
                } else {
                    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
                    if (existingCustomers.data.length > 0) {
                        customer = existingCustomers.data[0].id;
                    }
                }

                const session = await stripe.checkout.sessions.create({
                    customer: customer || undefined,
                    customer_email: customer ? undefined : email,
                    mode: 'subscription',
                    payment_method_types: ['card'],
                    line_items: [{
                        price: priceId,
                        quantity: 1
                    }],
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                    metadata: {
                        user_email: email
                    }
                });
                return Response.json({ success: true, sessionId: session.id, url: session.url });

            case 'createPortalSession':
                const portalSession = await stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: successUrl
                });
                return Response.json({ success: true, url: portalSession.url });

            case 'getSubscription':
                const subscriptions = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'active',
                    limit: 1,
                    expand: ['data.items.data.price.product']
                });
                return Response.json({ 
                    success: true, 
                    subscription: subscriptions.data[0] || null 
                });

            case 'cancelSubscription':
                const canceledSub = await stripe.subscriptions.cancel(subscriptionId);
                return Response.json({ success: true, subscription: canceledSub });

            case 'getCustomerByEmail':
                const customers = await stripe.customers.list({ email, limit: 1 });
                return Response.json({ 
                    success: true, 
                    customer: customers.data[0] || null 
                });

            case 'listPrices':
                const prices = await stripe.prices.list({
                    active: true,
                    expand: ['data.product'],
                    type: 'recurring',
                });

                const filteredPrices = prices.data.filter(price => {
                    const product = price.product;
                    return product && typeof product === 'object' && product.active;
                });

                return Response.json({ success: true, prices: filteredPrices });

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});