import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useSharedDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      const { data } = await base44.functions.invoke('getSharedDocuments');
      setDocuments(data.shared_documents || []);
    } catch (err) {
      console.error('Fetch shared documents error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (shareId) => {
    try {
      await base44.functions.invoke('revokeDocumentShare', {
        share_id: shareId
      });
      setDocuments(prev => prev.filter(d => d.id !== shareId));
    } catch (err) {
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    refetch: fetchSharedDocuments,
    revokeShare
  };
}