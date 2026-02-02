import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useAuth from './useAuth';

export default function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [tier, setTier] = useState('free');
    const [loading, setLoading] = useState(true);
    const [customerId, setCustomerId] = useState(null);

    useEffect(() => {
        if (user) {
            fetchSubscription();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchSubscription = async () => {
       try {
           // User hat kein Abo-System → einfach als 'free' setzen
           setTier('free');
       } catch (error) {
           console.error('Failed to fetch subscription:', error);
           setTier('free');
       } finally {
           setLoading(false);
       }
    };

    const createCheckout = async (priceId) => {
        const { data } = await base44.functions.invoke('billing', {
            action: 'createCheckoutSession',
            email: user.email,
            priceId,
            successUrl: window.location.origin + '/billing?success=true',
            cancelUrl: window.location.origin + '/billing?canceled=true'
        });

        if (data.success) {
            window.location.href = data.url;
        }
        return data;
    };

    const manageSubscription = async () => {
        if (!customerId) {
            console.error('No customer ID available');
            return;
        }
        
        const { data } = await base44.functions.invoke('billing', {
            action: 'createPortalSession',
            customerId,
            successUrl: window.location.origin + '/billing'
        });

        if (data.success) {
            window.location.href = data.url;
        }
    };

    const cancelSubscription = async () => {
        if (!subscription?.id) return;

        const { data } = await base44.functions.invoke('billing', {
            action: 'cancelSubscription',
            subscriptionId: subscription.id
        });

        if (data.success) {
            await fetchSubscription();
        }
        return data;
    };

    return {
        subscription,
        tier,
        loading,
        customerId,
        createCheckout,
        manageSubscription,
        cancelSubscription,
        refetch: fetchSubscription
    };
}