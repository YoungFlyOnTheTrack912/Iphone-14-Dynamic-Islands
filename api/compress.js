const Compression = require('../lib/compression');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const type = req.query.type || 'html'; // html, css, js
  const data = req.query.data;

  if (!data) {
    return res.status(400).json({ error: 'Missing data param' });
  }

  try {
    let compressed;

    if (type === 'html') {
      compressed = Compression.minifyHTML(data);
    } else if (type === 'css') {
      compressed = Compression.minifyCSS(data);
    } else if (type === 'js') {
      compressed = Compression.minifyJS(data);
    } else {
      return res.status(400).json({ error: 'Unknown type' });
    }

    const originalSize = Buffer.byteLength(data);
    const compressedSize = Buffer.byteLength(compressed);

    res.json({
      original: originalSize,
      compressed: compressedSize,
      saved: originalSize - compressedSize,
      ratio: ((1 - compressedSize / originalSize) * 100).toFixed(2) + '%',
      data: compressed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
