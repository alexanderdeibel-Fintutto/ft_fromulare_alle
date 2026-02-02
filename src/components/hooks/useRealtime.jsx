import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useRealtime Hook
 * Subscribe to entity changes in real-time
 */

export function useRealtime(entityName, onUpdate) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!entityName) return;

    setIsConnected(true);

    const unsubscribe = base44.entities[entityName]?.subscribe?.((event) => {
      const updateData = {
        type: event.type,
        id: event.id,
        data: event.data,
        timestamp: new Date()
      };

      setData(updateData);
      onUpdate?.(updateData);
    });

    return () => {
      unsubscribe?.();
      setIsConnected(false);
    };
  }, [entityName, onUpdate]);

  return { data, isConnected };
}

/**
 * useRealtimeList Hook
 * Subscribe to all changes on an entity
 */

export function useRealtimeList(entityName, initialData = []) {
  const [items, setItems] = useState(initialData);

  useEffect(() => {
    if (!entityName) return;

    const unsubscribe = base44.entities[entityName]?.subscribe?.((event) => {
      setItems(prev => {
        if (event.type === 'create') {
          return [...prev, event.data];
        } else if (event.type === 'update') {
          return prev.map(item => 
            item.id === event.id ? event.data : item
          );
        } else if (event.type === 'delete') {
          return prev.filter(item => item.id !== event.id);
        }
        return prev;
      });
    });

    return () => unsubscribe?.();
  }, [entityName]);

  return items;
}

export default useRealtime;