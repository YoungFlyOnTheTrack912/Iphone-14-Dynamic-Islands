const NodeCache = require('node-cache');

// In-memory cache with 10-minute TTL
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

class CacheManager {
  get(key) {
    return cache.get(key);
  }

  set(key, value, ttl = 600) {
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
