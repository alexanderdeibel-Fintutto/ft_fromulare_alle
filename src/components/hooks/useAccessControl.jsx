import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Hook zum Prüfen ob ein User ein Dokument/Formular kauft hat
 * @param {string} userEmail - User Email
 * @param {string} documentId - Document/Product ID
 * @returns {Object} { hasAccess, loading, error }
 */
export function useAccessControl(userEmail, documentId) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userEmail || !documentId) {
      setLoading(false);
      return;
    }
    checkAccess();
  }, [userEmail, documentId]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // Suche nach gekauftem Dokument/Template
      const { data, error: err } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_email', userEmail)
        .eq('product_id', documentId)
        .eq('status', 'completed')
        .single();

      if (err && err.code !== 'PGRST116') throw err; // PGRST116 = no rows
      setHasAccess(!!data);
    } catch (err) {
      console.error('Error checking access:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { hasAccess, loading, error };
}