const CacheManager = require('../lib/cache');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  const action = req.query.action || 'status';

  if (action === 'status') {
    const stats = CacheManager.getStats();
    return res.json({
      cached: stats.ksize,
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    });
  }

  if (action === 'clear') {
    CacheManager.clear();
    return res.json({ message: 'Cache cleared' });
  }

  if (action === 'delete' && req.query.key) {
    CacheManager.delete(req.query.key);
    return res.json({ message: 'Cache entry deleted' });
  }

  res.status(400).json({ error: 'Unknown action' });
};
