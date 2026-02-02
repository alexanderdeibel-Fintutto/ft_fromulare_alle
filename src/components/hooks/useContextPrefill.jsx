import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const PREFILL_MAPPINGS = {
  tenant: {
    firstName: ['tenant', 'first_name'],
    lastName: ['tenant', 'last_name'],
    email: ['tenant', 'email'],
    phone: ['tenant', 'phone'],
    birthDate: ['tenant', 'birth_date'],
    address: ['tenant', 'address'],
    apartmentNumber: ['unit', 'number'],
    postalCode: ['unit', 'building', 'postal_code'],
    city: ['unit', 'building', 'city'],
    buildingAddress: ['building', 'address']
  },
  unit: {
    apartmentNumber: ['unit', 'number'],
    postalCode: ['unit', 'building', 'postal_code'],
    city: ['unit', 'building', 'city'],
    buildingAddress: ['building', 'address'],
    tenantFirstName: ['tenant', 'first_name'],
    tenantLastName: ['tenant', 'last_name'],
    tenantEmail: ['tenant', 'email'],
    tenantPhone: ['tenant', 'phone']
  },
  lease: {
    tenantFirstName: ['tenant', 'first_name'],
    tenantLastName: ['tenant', 'last_name'],
    tenantEmail: ['tenant', 'email'],
    tenantPhone: ['tenant', 'phone'],
    apartmentNumber: ['unit', 'number'],
    postalCode: ['unit', 'building', 'postal_code'],
    city: ['unit', 'building', 'city'],
    buildingAddress: ['building', 'address'],
    startDate: ['lease', 'start_date'],
    endDate: ['lease', 'end_date'],
    rent: ['lease', 'rent_amount_cents']
  }
};

function getNestedValue(obj, path) {
  if (!obj) return undefined;
  return path.reduce((current, key) => {
    if (!current) return undefined;
    if (Array.isArray(current)) return current[0]?.[key];
    return current[key];
  }, obj);
}

function mapPrefillData(prefillData, contextType) {
  const mapping = PREFILL_MAPPINGS[contextType] || {};
  const result = {};
  Object.entries(mapping).forEach(([fieldId, path]) => {
    const value = getNestedValue(prefillData, path);
    if (value !== undefined && value !== null) {
      result[fieldId] = value;
    }
  });
  return result;
}

function hasSufficientPrefillData(prefillData, contextType) {
  if (!prefillData || !contextType) return false;
  const mapping = PREFILL_MAPPINGS[contextType] || {};
  const filledCount = Object.values(mapping).filter(
    path => getNestedValue(prefillData, path) !== undefined
  ).length;
  const minRequired = Math.ceil(Object.keys(mapping).length * 0.3);
  return filledCount >= minRequired;
}

export function useContextPrefill() {
  const [searchParams] = useSearchParams();
  const [prefillData, setPrefillData] = useState(null);
  const [mappedData, setMappedData] = useState({});
  const [loading, setLoading] = useState(false);
  
  const sourceApp = searchParams.get('from');
  const contextType = searchParams.get('context_type');
  const contextId = searchParams.get('context_id');
  
  useEffect(() => {
    if (!contextType || !contextId) {
      setPrefillData(null);
      setMappedData({});
      return;
    }
    
    async function loadPrefillData() {
      setLoading(true);
      try {
        const user = await base44.auth.me();
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Load context data based on context type
        const data = {};
        
        // Fetch from external app if context_source is specified
        const contextSource = searchParams.get('context_source');
        if (contextSource && contextId) {
          // For now, store context metadata
          // In production, this would fetch from the source app's API
          data.context_source = contextSource;
          data.context_id = contextId;
        }
        
        if (hasSufficientPrefillData(data, contextType)) {
          setPrefillData(data);
          const mapped = mapPrefillData(data, contextType);
          setMappedData(mapped);
        }
      } catch (err) {
        console.error('Prefill load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadPrefillData();
  }, [contextType, contextId]);
  
  return {
    sourceApp,
    contextType,
    contextId,
    prefillData,
    mappedData,
    loading,
    hasPrefill: !!prefillData && Object.keys(mappedData).length > 0
  };
}