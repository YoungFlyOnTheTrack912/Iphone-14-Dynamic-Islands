const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URL } = require('url');

let CacheManager, ProxyExtensions, Compression;
try {
  CacheManager = require('../lib/cache');
  ProxyExtensions = require('../lib/extensions');
  Compression = require('../lib/compression');
} catch (e) {
  // Fallback if libs not available
  CacheManager = { get: () => null, set: () => {}, delete: () => {} };
  ProxyExtensions = { apply: (h) => h };
  Compression = { minifyHTML: (h) => h };
}

function isDataOrJsScheme(v) {
  return /^data:|^javascript:/i.test(v);
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const target = req.query.url;
  const extensions = (req.query.ext || '').split(',').filter(Boolean);
  const noCache = req.query.noCache === 'true';

  if (!target) {
    return res.status(400).json({ error: 'Missing url param' });
  }

  // Check cache
  const cacheKey = `proxy:${target}:${extensions.join(',')}`;
  if (!noCache && CacheManager.get) {
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Cached', 'true');
      return res.status(200).send(cached);
    }
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    try {
      if (/^\/\//.test(target)) {
        targetUrl = new URL('https:' + target);
      } else if (/^[a-z0-9][\w.-]*\.[a-z]{2,}/i.test(target)) {
        targetUrl = new URL('https://' + target);
      } else {
        return res.status(400).json({ error: 'Invalid URL' });
      }
    } catch (e2) {
      return res.status(400).json({ error: 'Invalid URL: ' + e2.message });
    }
  }

  try {
    const upstream = await fetch(targetUrl.href, {
      headers: {
        'user-agent': req.headers['user-agent'] || 'Proxy/1.0'
      }
    });

    const contentType = upstream.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      let text = await upstream.text();
      const $ = cheerio.load(text, { decodeEntities: false });

      $('head').prepend(`<base href="${targetUrl.origin}${targetUrl.pathname.replace(/\/[^/]*$/, '/')}">`);

      // Apply extensions
      if (extensions.length > 0 && ProxyExtensions.apply) {
        text = ProxyExtensions.apply(text, extensions);
      }

      // Minify HTML
      if (Compression.minifyHTML) {
        text = Compression.minifyHTML(text);
      }

      const selectors = [
        { sel: 'a', attr: 'href' },
        { sel: 'link', attr: 'href' },
        { sel: 'script', attr: 'src' },
        { sel: 'img', attr: 'src' },
        { sel: 'iframe', attr: 'src' },
        { sel: 'form', attr: 'action' },
        { sel: 'source', attr: 'src' }
      ];

      selectors.forEach(({ sel, attr }) => {
        $(sel).each((i, el) => {
          const $el = $(el);
          const v = $el.attr(attr);
          if (!v) return;
          if (isDataOrJsScheme(v) || /^mailto:|^tel:/i.test(v)) return;
          let abs;
          try { abs = new URL(v, targetUrl).href; } catch (e) { return; }
          $el.attr(attr, '/api/proxy?url=' + encodeURIComponent(abs));
        });
      });

      $('meta[http-equiv="refresh"]').each((i, el) => {
        const content = $(el).attr('content');
        const m = content && content.match(/^\s*\d+\s*;\s*url=(.+)$/i);
        if (m) {
          let abs;
          try { abs = new URL(m[1], targetUrl).href; } catch (e) { return; }
          $(el).attr('content', content.replace(m[1], '/api/proxy?url=' + encodeURIComponent(abs)));
        }
      });

      $('meta[http-equiv="Content-Security-Policy"]').remove();

      const html = $.html();

      // Cache result
      if (CacheManager.set) {
        CacheManager.set(cacheKey, html, 600);
      }

      res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Cached', 'false');
      res.status(200).send(html);
      return;
    }

    upstream.headers.forEach((v, k) => {
      const key = k.toLowerCase();
      if (['content-security-policy', 'x-frame-options', 'x-xss-protection'].includes(key)) return;
      res.setHeader(k, v);
    });
    res.status(upstream.status);
    upstream.body.pipe(res);
  } catch (err) {
    res.status(502).json({ error: 'Fetch failed: ' + err.message });
  }
};
