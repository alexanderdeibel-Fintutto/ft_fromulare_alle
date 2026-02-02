import React, { createContext, useContext, useEffect } from 'react';
import { useTenantContext } from '../hooks/useTenantContext';
import { base44 } from '@/api/base44Client';

const TenantContext = createContext();

/**
 * Provider für globalen Tenant/Building Context
 * Wrap deine App damit: <TenantProvider><YourApp /></TenantProvider>
 */
export function TenantProvider({ children }) {
  const context = useTenantContext();

  useEffect(() => {
    // Setup Realtime Subscriptions für Tenant Context
    if (context.building_id) {
      const unsubscribeInvoice = base44.entities.Invoice.subscribe((event) => {
        // Broadcast tenant context changes
        window.dispatchEvent(
          new CustomEvent('tenantDataChanged', {
            detail: { entity_type: 'Invoice', event_type: event.type, data: event.data }
          })
        );
      });

      const unsubscribeSubscription = base44.entities.Subscription.subscribe((event) => {
        window.dispatchEvent(
          new CustomEvent('tenantDataChanged', {
            detail: { entity_type: 'Subscription', event_type: event.type, data: event.data }
          })
        );
      });

      return () => {
        unsubscribeInvoice();
        unsubscribeSubscription();
      };
    }
  }, [context.building_id]);

  return (
    <TenantContext.Provider value={context}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant muss innerhalb TenantProvider genutzt werden');
  }
  return context;
}