import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function useRealtimeShares(documentId) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    loadShares();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.DocumentShare.subscribe((event) => {
      if (event.data?.document_id === documentId) {
        if (event.type === 'create') {
          setShares(prev => [...prev, event.data]);
        } else if (event.type === 'update') {
          setShares(prev => prev.map(s => s.id === event.id ? event.data : s));
        } else if (event.type === 'delete') {
          setShares(prev => prev.filter(s => s.id !== event.id));
        }
      }
    });

    return unsubscribe;
  }, [documentId]);

  const loadShares = async () => {
    try {
      setLoading(true);
      const allShares = await base44.entities.DocumentShare.filter({
        document_id: documentId
      });
      setShares(allShares || []);
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  };

  return { shares, loading, refetch: loadShares };
}