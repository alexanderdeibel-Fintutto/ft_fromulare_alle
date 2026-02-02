/**
 * Request Queue
 * Manages concurrent requests and prevents duplicates
 */

export class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.active = 0;
    this.requests = new Map();
  }

  async add(key, fn) {
    // Deduplicate identical requests
    if (this.requests.has(key)) {
      return this.requests.get(key);
    }

    const promise = new Promise((resolve, reject) => {
      this.queue.push({ key, fn, resolve, reject });
      this.process();
    });

    this.requests.set(key, promise);

    return promise.finally(() => {
      this.requests.delete(key);
    });
  }

  async process() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.active++;
    const { key, fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.active--;
      this.process();
    }
  }

  size() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

export const requestQueue = new RequestQueue();

export default requestQueue;