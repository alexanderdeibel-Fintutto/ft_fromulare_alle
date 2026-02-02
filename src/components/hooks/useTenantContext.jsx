import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook für Tenant/Building Context Management
 * Lädt aus URL, LocalStorage, oder Request Headers
 */
export function useTenantContext() {
  const [context, setContext] = useState({
    tenant_id: null,
    building_id: null,
    unit_id: null,
    loading: true
  });

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = async () => {
    try {
      // Versuche aus URL zu laden
      const urlParams = new URLSearchParams(window.location.search);
      const urlTenantId = urlParams.get('tenant_id');
      const urlBuildingId = urlParams.get('building_id');
      const urlUnitId = urlParams.get('unit_id');

      // Falls vorhanden, nutze URL Params
      if (urlTenantId || urlBuildingId) {
        setContext({
          tenant_id: urlTenantId,
          building_id: urlBuildingId,
          unit_id: urlUnitId,
          loading: false
        });
        return;
      }

      // Sonst versuche aus Supabase zu laden
      const response = await base44.functions.invoke('extractTenantContext', {});
      
      setContext({
        tenant_id: response.data.tenant_id,
        building_id: response.data.building_id,
        unit_id: null,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load tenant context:', error);
      setContext(prev => ({ ...prev, loading: false }));
    }
  };

  const setTenantContext = useCallback((tenant_id, building_id, unit_id = null) => {
    setContext({
      tenant_id,
      building_id,
      unit_id,
      loading: false
    });

    // Speichere in URL für Bookmark-Support
    const params = new URLSearchParams(window.location.search);
    if (tenant_id) params.set('tenant_id', tenant_id);
    if (building_id) params.set('building_id', building_id);
    if (unit_id) params.set('unit_id', unit_id);

    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }, []);

  return { ...context, setTenantContext };
}