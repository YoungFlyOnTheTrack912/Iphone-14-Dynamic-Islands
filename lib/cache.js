const NodeCache = require('node-cache');

// In-memory cache with 1-hour TTL for better performance
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

class CacheManager {
  get(key) {
    return cache.get(key);
  }

  set(key, value, ttl = 3600) {
    cache.set(key, value, ttl);
  }

  delete(key) {
    cache.del(key);
  }

  clear() {
    cache.flushAll();
  }

  getStats() {
    return cache.getStats();
  }
}

module.exports = new CacheManager();
