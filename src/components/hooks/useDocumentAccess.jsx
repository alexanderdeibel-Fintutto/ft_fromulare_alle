import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useDocumentAccess(documentId) {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    checkAccess();
  }, [documentId]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const { data } = await base44.functions.invoke('checkDocumentAccess', {
        document_id: documentId
      });
      setAccess(data);
    } catch (err) {
      console.error('Check access error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { access, loading, error, refetch: checkAccess };
}