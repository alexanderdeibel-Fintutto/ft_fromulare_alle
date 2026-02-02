import { base44 } from '@/api/base44Client';

// Stripe Price IDs
export const STRIPE_PRICES = {
  free: 'price_1Sr55p52lqSgjCzeX6tlI5tv',
  basic: 'price_1Sr58r52lqSgjCze0I3R3DZ2',
  pro: 'price_1Sr5Ev52lqSgjCzehlVFvukL',
  enterprise: 'price_1Sr5IT52lqSgjCzeM6lyI8aW'
};

export const PLANS = {
  free: {
    id: 'free',
    name: 'Kostenlos',
    price: 0,
    priceId: STRIPE_PRICES.free,
    features: ['1 Objekt / Einheit', 'Basis-Rechner', 'Mietrecht-Assistent (limitiert)', 'Community Support']
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    priceId: STRIPE_PRICES.basic,
    features: ['Bis zu 5 Objekte', 'Alle Rechner & Tools', 'Mietrecht-Assistent', 'E-Mail Support', 'Dokument-Export']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceId: STRIPE_PRICES.pro,
    popular: true,
    features: ['Unbegrenzte Objekte', 'Vermietify Vollversion', 'HausmeisterPro', 'Priority Support', 'API-Zugang', 'Team-Funktionen']
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 89,
    priceId: STRIPE_PRICES.enterprise,
    features: ['Alles aus Pro', 'Multi-Mandanten', 'White-Label Option', 'Dedicated Support', 'Custom Integrationen', 'SLA-Garantie']
  }
};

export async function createCheckoutSession(planId) {
  try {
    const isAuthenticated = await base44.auth.isAuthenticated();
    
    if (!isAuthenticated) {
      throw new Error('Nicht eingeloggt');
    }
    
    const plan = PLANS[planId];
    if (!plan) {
      throw new Error('Ungültiger Plan');
    }
    
    // Für Free-Plan: Direkt aktivieren ohne Stripe
    if (planId === 'free') {
      return { 
        success: true, 
        isFree: true,
        planId: 'free'
      };
    }
    
    // Stripe Checkout über Base44 Backend Function
    const response = await base44.functions.invoke('billing', {
      action: 'createCheckout',
      priceId: plan.priceId,
      planId: planId,
      successUrl: `${window.location.origin}/#/BillingSuccess?plan=${planId}`,
      cancelUrl: `${window.location.origin}/#/Billing?canceled=true`
    });
    
    if (response.data?.error) {
      throw new Error(response.data.error);
    }
    
    return {
      success: true,
      checkoutUrl: response.data.url,
      sessionId: response.data.sessionId
    };
    
  } catch (error) {
    console.error('Checkout Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function activatePlan(planId) {
  try {
    const isAuthenticated = await base44.auth.isAuthenticated();
    
    if (!isAuthenticated) {
      throw new Error('Nicht eingeloggt');
    }
    
    // Plan auf Base44 User speichern
    await base44.auth.updateMe({
      selected_plan: planId,
      is_onboarding_complete: true,
      plan_activated_at: new Date().toISOString()
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Plan Activation Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}