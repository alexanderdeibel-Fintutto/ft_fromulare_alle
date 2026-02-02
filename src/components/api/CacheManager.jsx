/**
 * Cache Manager
 * Manages application-wide caching
 */

export class CacheManager {
  constructor() {
    this.storage = new Map();
    this.ttl = new Map();
  }

  set(key, value, ttlSeconds = null) {
    this.storage.set(key, value);

    if (ttlSeconds) {
      const timer = setTimeout(() => {
        this.storage.delete(key);
        this.ttl.delete(key);
      }, ttlSeconds * 1000);

      this.ttl.set(key, timer);
    }
  }

  get(key) {
    return this.storage.get(key);
  }

  has(key) {
    return this.storage.has(key);
  }

  delete(key) {
    clearTimeout(this.ttl.get(key));
    this.storage.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.ttl.forEach(timer => clearTimeout(timer));
    this.storage.clear();
    this.ttl.clear();
  }

  // Pattern matching
  deletePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.storage.keys()) {
      if (regex.test(key)) {
        this.delete(key);
      }
    }
  }

  // Get all keys
  keys() {
    return Array.from(this.storage.keys());
  }

  // Get cache size
  size() {
    return this.storage.size;
  }

  // Warm up cache
  warmUp(entries) {
    entries.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl);
    });
  }

  // Get cache stats
  stats() {
    return {
      size: this.storage.size,
      keys: this.keys(),
      ttlCount: this.ttl.size
    };
  }
}

export const cacheManager = new CacheManager();

export default cacheManager;