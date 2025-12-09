class ResponseFilter {
  // Filter and modify response headers
  static filterHeaders(headers, preserveList = []) {
    const safeHeaders = new Map();
    const dangerous = ['set-cookie', 'server', 'x-powered-by', 'x-aspnet-version'];

    for (const [key, value] of headers.entries()) {
      const lower = key.toLowerCase();
      if (!dangerous.includes(lower) || preserveList.includes(lower)) {
        safeHeaders.set(key, value);
      }
    }
    return safeHeaders;
  }

  // Inject performance-boosting headers
  static injectPerformanceHeaders(headers) {
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('ETag', 'W/"' + Date.now() + '"');
    return headers;
  }

  // Convert absolute URLs to proxy URLs in HTML
  static rewriteURLs(html, proxyPath = '/api/proxy') {
    return html
      .replace(/https?:\/\/[^\s"'>]+/g, (url) => {
        try {
          new URL(url);
          return proxyPath + '?url=' + encodeURIComponent(url);
        } catch {
          return url;
        }
      });
  }

  // Inject preload hints for performance
  static injectPreloadHints(html) {
    const preload = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
      <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap">
    `;
    return html.replace(/<head[^>]*>/i, '<head>' + preload);
  }
}

module.exports = ResponseFilter;
