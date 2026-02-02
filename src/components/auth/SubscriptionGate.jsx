import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Lock } from 'lucide-react';

/**
 * Subscription Gate
 * Protects features behind subscription tiers
 */

export default function SubscriptionGate({
  tier = 'free',
  children,
  fallback = null,
  showUpgrade = true
}) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      return;
    }

    // Get user's subscription tier
    const tierLevels = { free: 0, starter: 1, pro: 2, business: 3 };
    const userTier = tierLevels[user.subscription_tier || 'free'];
    const requiredTier = tierLevels[tier];

    setHasAccess(userTier >= requiredTier);
  }, [user, tier]);

  if (hasAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (!showUpgrade) {
    return null;
  }

  // Default upgrade prompt
  const tiers = {
    starter: { name: 'Starter Plan', description: 'Upgrade für diese Funktion' },
    pro: { name: 'Pro Plan', description: 'Diese Funktion benötigt Pro' },
    business: { name: 'Business Plan', description: 'Diese Funktion benötigt Business' }
  };

  const tierInfo = tiers[tier] || tiers.starter;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gray-50 rounded-lg opacity-60 flex items-center justify-center z-10">
        <div className="text-center">
          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">{tierInfo.name}</p>
          <p className="text-xs text-gray-500">{tierInfo.description}</p>
        </div>
      </div>
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

/**
 * useSubscription Hook
 */

export function useSubscription() {
  const { user } = useAuth();

  const hasSubscription = (tier) => {
    if (!user) return false;
    const tierLevels = { free: 0, starter: 1, pro: 2, business: 3 };
    const userTier = tierLevels[user.subscription_tier || 'free'];
    const requiredTier = tierLevels[tier];
    return userTier >= requiredTier;
  };

  return {
    currentTier: user?.subscription_tier || 'free',
    hasSubscription,
    isActive: !!user?.subscription_active,
    renewalDate: user?.subscription_renewal_date,
    features: user?.subscription_features || []
  };
}