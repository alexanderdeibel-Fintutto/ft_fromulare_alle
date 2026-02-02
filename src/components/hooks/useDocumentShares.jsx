import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useDocumentShares(documentId) {
  const [shareCount, setShareCount] = useState(0);
  const [sharedWithApps, setSharedWithApps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    
    fetchShares();
  }, [documentId]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getDocumentShareStats', {
        document_id: documentId
      });
      
      if (response.data) {
        setShareCount(response.data.total_shares || 0);
        setSharedWithApps(response.data.apps || []);
      }
    } catch (error) {
      console.error('Error fetching share stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { shareCount, sharedWithApps, loading, refetch: fetchShares };
}