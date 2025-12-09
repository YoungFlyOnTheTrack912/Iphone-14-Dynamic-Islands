module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const version = require('../package.json').version;
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  res.json({
    status: 'online',
    version: version,
    uptime: Math.floor(uptime) + ' seconds',
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memory.external / 1024 / 1024) + ' MB'
    },
    endpoints: {
      proxy: '/api/proxy?url=<target>&ext=<extensions>',
      cache: '/api/cache?action=status|clear|delete&key=<key>',
      compress: '/api/compress?type=html|css|js&data=<data>',
      extensions: '/api/extensions?ext=adblock,tracking,privacy,malware,security&html=<html>',
      health: '/api/health'
    }
  });
};
