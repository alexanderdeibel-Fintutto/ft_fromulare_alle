// components/hooks/useTemplates.js
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useTemplates(filters = {}) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let mounted = true;
    
    async function load() {
      try {
        setLoading(true);
        let data = [];
        if (base44.entities.DocumentTemplate && base44.entities.DocumentTemplate.list) {
          const result = await base44.entities.DocumentTemplate.list('-created_date', 100);
          data = Array.isArray(result) ? result : [];
        }
        if (mounted) setTemplates(data);
      } catch (err) {
        if (mounted) {
          setError(err);
          setTemplates([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    load();
    return () => { mounted = false; };
  }, []);
  
  return { templates, loading, error };
}