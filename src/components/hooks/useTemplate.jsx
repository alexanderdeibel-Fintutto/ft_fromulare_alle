import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useTemplate(slug) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    
    let mounted = true;
    
    async function load() {
      try {
        setLoading(true);
        const data = await base44.entities.DocumentTemplate.filter(
          { slug },
          undefined,
          1
        );
        if (mounted) setTemplate(data?.[0] || null);
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    load();
    return () => { mounted = false; };
  }, [slug]);
  
  return { template, loading, error };
}