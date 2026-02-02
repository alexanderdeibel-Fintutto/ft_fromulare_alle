/**
 * React Hook für Tool Access
 */

import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { checkToolAccess } from '../services/accessCheck';

export function useToolAccess() {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);
      const result = await checkToolAccess();
      setAccess(result);
    } catch (err) {
      console.error('useToolAccess error:', err);
      setAccess({ tier: 'anonymous', features: {}, limits: {} });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const canUse = (feature) => access?.features?.[feature] || false;
  const isPremium = access?.tier === 'premium' || access?.tier === 'enterprise';
  const isBasic = access?.tier === 'basic';

  return {
    ...access,
    loading,
    canUse,
    isPremium,
    isBasic,
    refresh: checkAccess
  };
}

/**
 * Hook für einzelnes Feature
 */
export function useFeature(featureName) {
  const { features, loading, tier } = useToolAccess();
  
  return {
    hasFeature: features?.[featureName] || false,
    loading,
    tier
  };
}

export default useToolAccess;