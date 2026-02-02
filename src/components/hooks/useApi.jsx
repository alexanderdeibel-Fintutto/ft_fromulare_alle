import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/ApiClient';

/**
 * useAPI Hook
 * Fetches data with loading, error, and caching
 */

export function useApi(
  url,
  options = {},
  dependencies = []
) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);

  const {
    method = 'GET',
    body = null,
    enabled = true,
    retries = 3,
    cacheTime = 0,
    onSuccess,
    onError
  } = options;

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.request(url, {
        method,
        data: body,
        retries,
        cacheTime
      });

      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = {
        message: err.message,
        status: err.status,
        retry: () => fetchData()
      };
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, method, body, enabled, retries, cacheTime, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    apiClient.invalidateCache(url);
    fetchData();
  }, [url, fetchData]);

  return { data, loading, error, refetch };
}

export default useApi;