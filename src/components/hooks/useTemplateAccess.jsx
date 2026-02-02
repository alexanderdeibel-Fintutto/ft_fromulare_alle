import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useTemplateAccess(templateId) {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!templateId) {
      setLoading(false);
      return;
    }
    
    async function check() {
      try {
        // Get current user
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          setAccess({ has_access: false });
          setLoading(false);
          return;
        }
        
        // Check purchases - only completed ones
        const purchases = await base44.entities.TemplatePurchase.filter(
          { user_email: currentUser.email, status: 'completed' },
          '-created_date',
          100
        );
        
        // Check for pack_all (unbegrenzt)
        const hasPackAll = purchases.some(p => p.package_type === 'pack_all');
        
        // Check für "single" Kauf dieser spezifischen Vorlage
        // Hinweis: Bei Single-Käufen speichern wir die template_id NICHT separat,
        // wir verwenden einfach package_type === 'single' und zählen das als Zugriff
        const hasSingleAccess = purchases.some(p => 
          p.package_type === 'single' && 
          p.tier_name === 'single'
        );
        
        // Check für Pack-5 mit verfügbaren Credits
        const pack5WithCredits = purchases.find(p => 
          p.package_type === 'pack_5' && 
          p.tier_name === 'pack_5' &&
          (p.credits_remaining > 0 || p.credits_remaining === null) // null = unbegrenzt
        );
        
        const hasAccess = hasPackAll || hasSingleAccess || !!pack5WithCredits;
        
        setAccess({
          has_access: hasAccess,
          has_pack_all: hasPackAll,
          has_single: hasSingleAccess,
          has_pack5_credits: !!pack5WithCredits,
          remaining_credits: pack5WithCredits?.credits_remaining || 0,
          pack5_purchase_id: pack5WithCredits?.id
        });
      } catch (err) {
        console.error('Access check failed:', err);
        setAccess({ has_access: false });
      } finally {
        setLoading(false);
      }
    }
    
    check();
  }, [templateId]);
  
  return { access, loading, hasAccess: access?.has_access || false };
}