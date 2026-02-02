import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook for real-time Base44 entity subscriptions
 * @param {string} entityName - The entity to subscribe to
 * @param {object} filter - Filter conditions (e.g., { org_id: '123' })
 * @param {object} options - Additional options
 * @returns {object} { data, loading, error, refetch }
 */
export default function useRealtimeSubscription(entityName, filter = {}, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const entity = base44.entities[entityName];
      
      if (!entity) {
        setData([]);
        setLoading(false);
        return;
      }

      // Fetch data with filter
      const hasFilter = Object.keys(filter).length > 0;
      let fetchedData;
      
      if (hasFilter) {
        fetchedData = await entity.filter(filter, options.orderBy || '-created_date');
      } else {
        fetchedData = await entity.list(options.orderBy || '-created_date');
      }

      setData(fetchedData || []);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${entityName}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup real-time subscription
    const entity = base44.entities[entityName];
    let unsubscribe = null;
    
    if (entity?.subscribe) {
      unsubscribe = entity.subscribe((event) => {
        if (event.type === 'create') {
          // Check if new record matches filter
          const matchesFilter = Object.entries(filter).every(
            ([key, value]) => event.data[key] === value
          );
          
          if (matchesFilter || Object.keys(filter).length === 0) {
            setData((current) => [event.data, ...current]);
          }
        } else if (event.type === 'update') {
          setData((current) =>
            current.map((item) =>
              item.id === event.id ? event.data : item
            )
          );
        } else if (event.type === 'delete') {
          setData((current) =>
            current.filter((item) => item.id !== event.id)
          );
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [entityName, JSON.stringify(filter)]);

  return { data, loading, error, refetch: fetchData };
}