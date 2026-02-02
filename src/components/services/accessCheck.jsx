/**
 * Access-Check Service für Tool/Rechner Apps
 * Prüft: Subscription, Seat, oder Lead (Free mit E-Mail)
 */

import { base44 } from '@/api/base44Client';

const TOOL_ID = 'rechner_tools';

/**
 * Hauptfunktion: Prüft Benutzer-Tier
 * @returns {Object} { tier, features, limits }
 */
export async function checkToolAccess() {
  try {
    const isAuthenticated = await base44.auth.isAuthenticated();
    
    // 1. Nicht eingeloggt → Free Tier (mit Lead-Capture)
    if (!isAuthenticated) {
      return {
        tier: 'anonymous',
        features: getFeaturesByTier('anonymous'),
        limits: getLimitsByTier('anonymous'),
        requiresEmail: true
      };
    }

    const user = await base44.auth.me();
    
    if (!user) {
      return {
        tier: 'anonymous',
        features: getFeaturesByTier('anonymous'),
        limits: getLimitsByTier('anonymous'),
        requiresEmail: true
      };
    }

    // 2. Prüfe Premium-Subscription basierend auf selected_plan
    const userPlan = user.selected_plan || 'free';
    
    if (userPlan === 'pro' || userPlan === 'business' || userPlan === 'enterprise') {
      return {
        tier: 'premium',
        features: getFeaturesByTier('premium'),
        limits: getLimitsByTier('premium'),
        subscription: { plan: userPlan }
      };
    }

    if (userPlan === 'basic') {
      return {
        tier: 'basic',
        features: getFeaturesByTier('basic'),
        limits: getLimitsByTier('basic'),
        subscription: { plan: userPlan }
      };
    }

    // 3. Eingeloggt aber kein Abo → Free Tier
    return {
      tier: 'free',
      features: getFeaturesByTier('free'),
      limits: getLimitsByTier('free'),
      userId: user.id
    };

  } catch (error) {
    console.error('Tool access check error:', error);
    return {
      tier: 'anonymous',
      features: getFeaturesByTier('anonymous'),
      limits: getLimitsByTier('anonymous'),
      error: error.message
    };
  }
}

/**
 * Feature-Matrix nach Tier
 */
function getFeaturesByTier(tier) {
  const features = {
    anonymous: {
      basic_calculation: true,
      view_result: true,
      pdf_export: false,
      save_calculation: false,
      advanced_analysis: false,
      comparison: false,
      api_access: false
    },
    free: {
      basic_calculation: true,
      view_result: true,
      pdf_export: false,
      save_calculation: false,
      advanced_analysis: false,
      comparison: false,
      api_access: false
    },
    basic: {
      basic_calculation: true,
      view_result: true,
      pdf_export: true,
      save_calculation: true,
      advanced_analysis: false,
      comparison: false,
      api_access: false
    },
    premium: {
      basic_calculation: true,
      view_result: true,
      pdf_export: true,
      save_calculation: true,
      advanced_analysis: true,
      comparison: true,
      api_access: false
    },
    enterprise: {
      basic_calculation: true,
      view_result: true,
      pdf_export: true,
      save_calculation: true,
      advanced_analysis: true,
      comparison: true,
      api_access: true
    }
  };

  return features[tier] || features.anonymous;
}

/**
 * Limits nach Tier
 */
function getLimitsByTier(tier) {
  const limits = {
    anonymous: {
      calculations_per_day: 3,
      saved_calculations: 0,
      pdf_exports_per_month: 0
    },
    free: {
      calculations_per_day: 10,
      saved_calculations: 0,
      pdf_exports_per_month: 0
    },
    basic: {
      calculations_per_day: 50,
      saved_calculations: 10,
      pdf_exports_per_month: 10
    },
    premium: {
      calculations_per_day: -1,
      saved_calculations: 100,
      pdf_exports_per_month: -1
    },
    enterprise: {
      calculations_per_day: -1,
      saved_calculations: -1,
      pdf_exports_per_month: -1
    }
  };

  return limits[tier] || limits.anonymous;
}

export async function hasFeature(featureName) {
  const access = await checkToolAccess();
  return access.features?.[featureName] || false;
}

export default {
  checkToolAccess,
  hasFeature,
  getFeaturesByTier,
  getLimitsByTier
};