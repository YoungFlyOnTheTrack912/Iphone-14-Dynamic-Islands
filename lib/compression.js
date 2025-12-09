const zlib = require('zlib');

class Compression {
  // Compress with gzip
  static gzip(data) {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  // Compress with deflate
  static deflate(data) {
    return new Promise((resolve, reject) => {
      zlib.deflate(data, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  // Compress HTML (remove unnecessary whitespace)
  static minifyHTML(html) {
    return html
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s{2,}/g, ' ') // Reduce multiple spaces to single
      .replace(/<!--[\s\S]*?-->/g, ''); // Remove comments
  }

  // Minify inline CSS
  static minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1');
  }

  // Minify inline JS
  static minifyJS(js) {
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
}

module.exports = Compression;
