// ============================================================================
// useServiceManager Hook - Service-Zugriff in React Components
// ============================================================================

import { useEffect, useState } from 'react';
import { getServiceManager } from '@/functions/service-manager';

/**
 * Hook zum Aufrufen von Services
 * 
 * Usage:
 * const { callService, isLoading, error } = useServiceManager('vermietify');
 * 
 * const result = await callService('letterxpress', {
 *   letter_type: 'brief',
 *   recipient_name: '...'
 * });
 */
export function useServiceManager(appName) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceManager, setServiceManager] = useState(null);

  useEffect(() => {
    // ServiceManager wird backend-seitig initialisiert
    // Frontend nutzt fetch zur Edge Function
    setServiceManager(true);
  }, []);

  const callService = async (serviceKey, payload) => {
    setIsLoading(true);
    setError(null);

    try {
      // Detektiere ob Workspace Integration oder Edge Function
      const response = await fetch('/api/call-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: appName,
          service_key: serviceKey,
          payload
        })
      });

      if (!response.ok) {
        throw new Error(`Service call failed: ${response.statusText}`);
      }

      const data = await response.json();
      setIsLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  const listServices = async () => {
    try {
      const response = await fetch(`/api/list-services?app=${appName}`);
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  return {
    callService,
    listServices,
    isLoading,
    error,
    isReady: serviceManager !== null
  };
}

/**
 * Hook für spezifische Services
 */
export function useLetterXpress() {
  const { callService, ...rest } = useServiceManager('vermietify'); // appName als prop bestimmen
  
  const sendLetter = async (letterType, recipientData) => {
    return callService('letterxpress', {
      letter_type: letterType,
      ...recipientData
    });
  };

  return { sendLetter, ...rest };
}

export function useSchufa() {
  const { callService, ...rest } = useServiceManager('vermietify');
  
  const checkBonity = async (personData) => {
    return callService('schufa', personData);
  };

  return { checkBonity, ...rest };
}

export function useFinAPI() {
  const { callService, ...rest } = useServiceManager('vermietify');
  
  const syncTransactions = async (accountData) => {
    return callService('finapi', accountData);
  };

  return { syncTransactions, ...rest };
}

export function useDatevExport() {
  const { callService, ...rest } = useServiceManager('vermietify');
  
  const exportBookings = async (dateRange) => {
    return callService('datev', dateRange);
  };

  return { exportBookings, ...rest };
}