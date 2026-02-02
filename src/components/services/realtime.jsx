// Realtime Services - jetzt über Base44
// Base44 bietet entity.subscribe() für Realtime-Updates

import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Generischer Realtime Hook für Base44 Entities
export function useRealtimeTable(entityName, initialData = []) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initiale Daten laden
    const fetchData = async () => {
      try {
        const entity = base44.entities[entityName];
        if (entity) {
          const fetchedData = await entity.list('-created_date');
          setData(fetchedData || []);
        }
      } catch (error) {
        console.error(`Error fetching ${entityName}:`, error);
      }
      setLoading(false);
    };

    fetchData();

    // Realtime-Subscription einrichten (falls Entity existiert)
    let unsubscribe = null;
    const entity = base44.entities[entityName];
    if (entity?.subscribe) {
      unsubscribe = entity.subscribe((event) => {
        if (event.type === 'create') {
          setData((current) => [event.data, ...current]);
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

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [entityName]);

  return { data, loading };
}

// Realtime Hook mit Filter
export function useRealtimeQuery(entityName, filterFn = null, initialData = []) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initiale Daten laden
    const fetchData = async () => {
      try {
        const entity = base44.entities[entityName];
        if (entity) {
          const fetchedData = await entity.list('-created_date');
          const filtered = filterFn ? (fetchedData || []).filter(filterFn) : (fetchedData || []);
          setData(filtered);
        }
      } catch (error) {
        console.error(`Error fetching ${entityName}:`, error);
      }
      setLoading(false);
    };

    fetchData();

    // Realtime-Subscription
    let unsubscribe = null;
    const entity = base44.entities[entityName];
    if (entity?.subscribe) {
      unsubscribe = entity.subscribe((event) => {
        if (event.type === 'create') {
          if (!filterFn || filterFn(event.data)) {
            setData((current) => [event.data, ...current]);
          }
        } else if (event.type === 'update') {
          setData((current) => {
            const shouldInclude = !filterFn || filterFn(event.data);
            const exists = current.some(item => item.id === event.id);
            
            if (shouldInclude && exists) {
              return current.map((item) =>
                item.id === event.id ? event.data : item
              );
            } else if (shouldInclude && !exists) {
              return [event.data, ...current];
            } else if (!shouldInclude && exists) {
              return current.filter((item) => item.id !== event.id);
            }
            return current;
          });
        } else if (event.type === 'delete') {
          setData((current) =>
            current.filter((item) => item.id !== event.id)
          );
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [entityName, filterFn]);

  return { data, loading, setData };
}

// Spezifische Hooks für häufige Use Cases

// Hook für Immobilien - nutzt Base44 Entity "Property" (falls vorhanden)
export function useRealtimeProperties(userId) {
  return useRealtimeQuery(
    'Property',
    userId ? (property) => property.created_by === userId : null
  );
}

// Hook für Mietzahlungen
export function useRealtimeRentPayments(propertyId) {
  return useRealtimeQuery(
    'RentPayment',
    propertyId ? (payment) => payment.property_id === propertyId : null
  );
}

// Hook für Organisation Members
export function useRealtimeOrgMembers(orgId) {
  return useRealtimeQuery(
    'OrgMembership',
    (member) => member.org_id === orgId && member.status === 'active'
  );
}

// Hook für User Profile - nutzt Base44 User
export function useRealtimeUserProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const users = await base44.entities.User.filter({ id: userId });
        if (users && users.length > 0) {
          setProfile(users[0]);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
      setLoading(false);
    };

    fetchProfile();

    // Subscribe to User entity changes
    let unsubscribe = null;
    if (base44.entities.User?.subscribe) {
      unsubscribe = base44.entities.User.subscribe((event) => {
        if (event.id === userId && event.type === 'update') {
          setProfile(event.data);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  return { profile, loading, setProfile };
}

// Single Record Realtime Hook
export function useRealtimeRecord(entityName, recordId) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      return;
    }

    const fetchRecord = async () => {
      try {
        const entity = base44.entities[entityName];
        if (entity) {
          const records = await entity.filter({ id: recordId });
          if (records && records.length > 0) {
            setRecord(records[0]);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${entityName} record:`, error);
      }
      setLoading(false);
    };

    fetchRecord();

    let unsubscribe = null;
    const entity = base44.entities[entityName];
    if (entity?.subscribe) {
      unsubscribe = entity.subscribe((event) => {
        if (event.id === recordId) {
          if (event.type === 'update') {
            setRecord(event.data);
          } else if (event.type === 'delete') {
            setRecord(null);
          }
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [entityName, recordId]);

  return { record, loading, setRecord };
}