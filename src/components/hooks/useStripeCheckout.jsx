import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCheckoutSession = async (templateId, templateSlug, templateName, packageType, billingInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('createTemplateCheckout', {
        templateId,
        templateSlug,
        templateName,
        packageType,
        billingInfo
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else if (response.data?.error) {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.message || 'Checkout fehlgeschlagen');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
    error
  };
}