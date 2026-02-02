import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useTemplatePurchaseAccess(productId) {
  const [hasAccess, setHasAccess] = useState(false);
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAccess();
  }, [productId]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Suche nach gekauftem Template für diesen User
      const purchases = await base44.entities.TemplatePurchase.filter({
        user_email: user.email,
        product_id: productId,
        status: 'completed'
      });

      if (purchases.length > 0) {
        setHasAccess(true);
        setPurchase(purchases[0]);
      } else {
        setHasAccess(false);
      }
    } catch (err) {
      console.error('Error checking purchase access:', err);
      setError(err.message);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasAccess, purchase, loading, error, refetch: checkAccess };
}