import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useKIService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callKI = useCallback(async (action, message, conversationType = 'general') => {
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('callKIService', {
        action,
        message,
        conversation_type: conversationType,
      });

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { callKI, loading, error };
}

export function useAIContext() {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('loadAIContext', {});
      setContext(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { context, loading, error, loadContext };
}

export function useCheckCrossSell() {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkCrossSell = useCallback(async (message) => {
    if (!message) {
      setRecommendation(null);
      return null;
    }

    setLoading(true);

    try {
      const response = await base44.functions.invoke('checkCrossSell', {
        message,
      });

      setRecommendation(response.data?.recommendation || null);
      return response.data?.recommendation;
    } catch (err) {
      console.error('Cross-sell check error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendation, loading, checkCrossSell };
}