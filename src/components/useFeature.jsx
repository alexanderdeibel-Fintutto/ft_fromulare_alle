import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useAuth from './useAuth';

export default function useFeature(featureName) {
    const { user } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkFeature();
    }, [user, featureName]);

    const checkFeature = async () => {
        try {
            const customerId = user?.user_metadata?.stripe_customer_id;

            const { data } = await base44.functions.invoke('featureGates', {
                customerId,
                feature: featureName
            });

            setHasAccess(data.hasAccess);
        } catch (error) {
            console.error('Feature check failed:', error);
            setHasAccess(false);
        } finally {
            setLoading(false);
        }
    };

    return { hasAccess, loading };
}