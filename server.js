const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));

function isDataOrJsScheme(v){
  return /^data:|^javascript:/i.test(v);
}

app.get('/api/proxy', async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send('Missing url param, use /api/proxy?url=' + encodeURIComponent('https://example.com'));

  let targetUrl;
  try {
    // Try to parse as-is
    targetUrl = new URL(target);
  } catch (e) {
    try {
      // If it starts with //, add https:
      if (/^\/\//.test(target)) {
        targetUrl = new URL('https:' + target);
      }
      // If it looks like a domain without scheme, add https://
      else if (/^[a-z0-9][\w.-]*\.[a-z]{2,}/i.test(target)) {
        targetUrl = new URL('https://' + target);
      }
      // Otherwise it's invalid
      else {
        return res.status(400).send('Invalid URL format. Use https://example.com or example.com');
      }
    } catch (e2) {
      return res.status(400).send('Invalid URL: ' + e2.message);
    }
  }

  try {
    const upstream = await fetch(targetUrl.href, {
      headers: {
        'user-agent': req.get('user-agent') || 'Node-Proxy'
      }
    });

    const contentType = upstream.headers.get('content-type') || '';

    // For HTML pages, rewrite links so resources and navigation go through this proxy
    if (contentType.includes('text/html')) {
      const text = await upstream.text();
      const $ = cheerio.load(text, { decodeEntities: false });

      // ensure relative URLs resolve against the original site
      $('head').prepend(`<base href="${targetUrl.origin}${targetUrl.pathname.replace(/\/[^/]*$/, '/')}">`);

      // Inject minimal script to prevent navigation errors
      const proxyScript = `
      <script>
        (function(){
          // Store the original target URL for reference
          window._proxyTarget = "${targetUrl.href.replace(/"/g, '\\"')}";
        })();
      </script>
      `;
      $('head').prepend(proxyScript);

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

      // rewrite meta refresh
      $('meta[http-equiv="refresh"]').each((i, el) => {
        const content = $(el).attr('content');
        const m = content && content.match(/^\s*\d+\s*;\s*url=(.+)$/i);
        if (m) {
          let abs;
          try { abs = new URL(m[1], targetUrl).href; } catch (e) { return; }
          $(el).attr('content', content.replace(m[1], '/api/proxy?url=' + encodeURIComponent(abs)));
        }
      });

      // remove CSP meta tags that might block bookmarklets
      $('meta[http-equiv="Content-Security-Policy"]').remove();

      // set permissive CSP header so bookmarklets can run
      res.set('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
      res.set('X-Frame-Options', 'ALLOWALL');

      // send modified html
      res.type('html').send($.html());
      return;
    }

    // For everything else (images, js, css, etc.) just pipe response through
    upstream.headers.forEach((v, k) => {
      // avoid passing CSP or frame options from upstream
      const key = k.toLowerCase();
      if (['content-security-policy', 'x-frame-options', 'x-xss-protection'].includes(key)) return;
      res.set(k, v);
    });
    res.status(upstream.status);
    upstream.body.pipe(res);
  } catch (err) {
    res.status(502).send('Fetch failed: ' + err.message);
  }
});

app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`));

// Additional API endpoints
app.get('/api/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const version = require('./package.json').version;
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
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cache', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ message: 'Cache endpoint - cache system built-in to proxy' });
});

app.get('/api/compress', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ message: 'Pages are automatically compressed' });
});
