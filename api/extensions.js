const ProxyExtensions = require('../lib/extensions');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const extensions = (req.query.ext || '').split(',').filter(Boolean);
  const html = req.query.html;

  if (!html) {
    return res.status(400).json({ error: 'Missing html param' });
  }

  if (extensions.length === 0) {
    return res.status(400).json({ error: 'Missing ext param' });
  }

  try {
    const result = ProxyExtensions.apply(html, extensions);
    const originalSize = Buffer.byteLength(html);
    const resultSize = Buffer.byteLength(result);

    res.json({
      extensions: extensions,
      original: originalSize,
      result: resultSize,
      removed: originalSize - resultSize,
      html: result.substring(0, 500) + '...' // Preview
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
