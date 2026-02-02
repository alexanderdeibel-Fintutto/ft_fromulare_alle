// components/hooks/useUserPurchases.jsx
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useUserPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPurchases() {
      try {
        setLoading(true);
        const user = await base44.auth.me();
        
        if (!user) {
          setPurchases([]);
          return;
        }

        const data = await base44.entities.TemplatePurchase?.filter?.(
          { user_email: user.email, status: 'completed' },
          '-created_date',
          100
        ) || [];

        setPurchases(data);
      } catch (err) {
        console.error('Error loading purchases:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPurchases();
  }, []);

  // Calculate user's access
  const hasPackAll = purchases.some(p => p.package_type === 'pack_all');
  const pack5Credits = purchases
    .filter(p => p.package_type === 'pack_5')
    .reduce((sum, p) => sum + (p.credits_remaining || 0), 0);

  return {
    purchases,
    loading,
    error,
    hasPackAll,
    pack5Credits,
    refresh: async () => {
      const user = await base44.auth.me();
      if (user) {
        const data = await base44.entities.TemplatePurchase?.filter?.(
          { user_email: user.email, status: 'completed' },
          '-created_date',
          100
        ) || [];
        setPurchases(data);
      }
    }
  };
}