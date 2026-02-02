import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function PayPalButton({
  templateId,
  templateSlug,
  templateName,
  packageType,
  billingInfo,
  onSuccess,
  onError
}) {
  const [loading, setLoading] = useState(false);

  const handlePayPal = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createPayPalCheckout', {
        templateId,
        templateSlug,
        templateName,
        packageType,
        billingInfo
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        onError?.(response.data?.error || 'PayPal checkout failed');
      }
    } catch (err) {
      console.error('PayPal error:', err);
      onError?.(err.message || 'PayPal checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayPal}
      disabled={loading}
      className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Wird verarbeitet...
        </>
      ) : (
        'Mit PayPal zahlen'
      )}
    </Button>
  );
}