// Feature-Definitionen pro Plan
const PLAN_FEATURES = {
  // VERMIETIFY
  'vermietify_starter': {
    maxProperties: 1,
    features: ['dashboard', 'basic_reports']
  },
  'vermietify_basic': {
    maxProperties: 5,
    features: ['dashboard', 'basic_reports', 'documents', 'utilities']
  },
  'vermietify_pro': {
    maxProperties: 25,
    features: ['dashboard', 'basic_reports', 'documents', 'utilities', 
               'tax_export', 'tenant_portal', 'ai_assistant']
  },
  'vermietify_business': {
    maxProperties: Infinity,
    features: ['dashboard', 'basic_reports', 'documents', 'utilities',
               'tax_export', 'tenant_portal', 'ai_assistant', 
               'multi_user', 'api_access', 'priority_support']
  },
  
  // FINTUTTO
  'fintutto_free': {
    features: ['portfolio_dashboard']
  },
  'fintutto_premium': {
    features: ['portfolio_dashboard', 'all_modules', 'tax_export']
  },
  'fintutto_family': {
    maxUsers: 5,
    features: ['portfolio_dashboard', 'all_modules', 'tax_export', 'family_dashboard']
  },
  'fintutto_office': {
    maxUsers: 20,
    features: ['portfolio_dashboard', 'all_modules', 'tax_export', 
               'white_label', 'api_access', 'priority_support']
  }
};

// Feature prüfen
export function hasFeature(planId, feature) {
  const plan = PLAN_FEATURES[planId];
  if (!plan) return false;
  return plan.features.includes(feature);
}

// Limit prüfen
export function checkLimit(planId, limitType, currentValue) {
  const plan = PLAN_FEATURES[planId];
  if (!plan) return false;
  
  const limit = plan[limitType];
  if (limit === undefined || limit === Infinity) return true;
  
  return currentValue < limit;
}

// Upgrade benötigt?
export function requiresUpgrade(planId, feature) {
  if (hasFeature(planId, feature)) return null;
  
  // Finde günstigsten Plan mit diesem Feature
  for (const [id, plan] of Object.entries(PLAN_FEATURES)) {
    if (plan.features.includes(feature)) {
      return id;
    }
  }
  return null;
}