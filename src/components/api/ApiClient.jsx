import { base44 } from '@/api/base44Client';

/**
 * API Client
 * Centralized API calls with error handling
 */

export class ApiClient {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  async request(url, options = {}) {
    const { method = 'GET', data, retries = 3, cacheTime = 0 } = options;
    const cacheKey = `${method}:${url}`;

    // Check cache
    if (method === 'GET' && cacheTime > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data;
      }
    }

    // Check pending
    if (this.pending.has(cacheKey)) {
      return this.pending.get(cacheKey);
    }

    // Make request with retry logic
    const promise = this.retry(
      () => this.makeRequest(url, { ...options, method, data }),
      retries
    );

    this.pending.set(cacheKey, promise);

    try {
      const result = await promise;

      // Cache GET requests
      if (method === 'GET' && cacheTime > 0) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } finally {
      this.pending.delete(cacheKey);
    }
  }

  async makeRequest(url, options) {
    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.data ? JSON.stringify(options.data) : undefined
      });

      if (!response.ok) {
        throw new ApiError(response.statusText, response.status);
      }

      return response.json();
    } catch (error) {
      throw new ApiError(error.message, error.status || 500);
    }
  }

  async retry(fn, retries) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      }
    }

    throw lastError;
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern) {
    if (!pattern) {
      this.clearCache();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();

export default apiClient;