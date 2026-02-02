import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useRealtimeSubscription(entityName, callback) {
  useEffect(() => {
    let unsubscribe;

    async function setupSubscription() {
      try {
        // Subscribe to entity changes
        unsubscribe = base44.entities[entityName].subscribe((event) => {
          if (callback) {
            callback(event);
          }
        });
      } catch (err) {
        console.error(`Subscribe to ${entityName} failed:`, err);
      }
    }

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [entityName, callback]);
}