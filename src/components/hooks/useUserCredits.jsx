// components/hooks/useUserCredits.jsx
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useAuth from '../useAuth';

export function useUserCredits() {
  const { user } = useAuth();
  const [hasPackAll, setHasPackAll] = useState(false);
  const [pack5Credits, setPack5Credits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const purchases = await base44.entities.TemplatePurchase.filter(
          { user_email: user.email, status: 'completed' },
          '-created_date',
          50
        );

        const hasAll = purchases.some(p => p.package_type === 'pack_all');
        setHasPackAll(hasAll);

        if (!hasAll) {
          const pack5 = purchases.find(p => p.package_type === 'pack_5' && p.credits_remaining > 0);
          setPack5Credits(pack5?.credits_remaining || 0);
        }
      } catch (err) {
        console.error('Error loading credits:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCredits();
  }, [user]);

  const totalCredits = hasPackAll ? Infinity : pack5Credits;
  const hasCredits = hasPackAll || pack5Credits > 0;

  return {
    totalCredits,
    hasCredits,
    hasPackAll,
    pack5Credits,
    loading
  };
}