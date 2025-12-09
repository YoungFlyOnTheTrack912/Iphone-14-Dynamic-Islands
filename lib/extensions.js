class ProxyExtensions {
  // Ad blocking patterns
  static blockAds(html) {
    return html
      .replace(/<script[^>]*src=[^>]*google.*?><\/script>/gi, '')
      .replace(/<script[^>]*src=[^>]*ads.*?><\/script>/gi, '')
      .replace(/<script[^>]*src=[^>]*doubleclick.*?><\/script>/gi, '')
      .replace(/<script[^>]*src=[^>]*facebook.*?><\/script>/gi, '')
      .replace(/<iframe[^>]*src=[^>]*ads.*?<\/iframe>/gi, '')
      .replace(/<div[^>]*id=[^>]*(ad|ads|advertisement).*?<\/div>/gi, '');
  }

  // Strip tracking pixels
  static stripTracking(html) {
    return html
      .replace(/<img[^>]*src=[^>]*(analytics|tracking|pixel|beacon).*?>/gi, '')
      .replace(/<script[^>]*src=[^>]*(analytics|gtag|google-analytics).*?><\/script>/gi, '');
  }

  // Remove meta tags that leak privacy
  static stripPrivacy(html) {
    return html.replace(/<meta[^>]*name="?(keywords|description|author)"?[^>]*>/gi, '');
  }

  // Block malicious scripts
  static blockMalicious(html) {
    return html
      .replace(/<script[^>]*src=[^>]*(eval|miner|bitcoin).*?><\/script>/gi, '')
      .replace(/<script>[\s\S]*?eval\([\s\S]*?\)<\/script>/gi, '');
  }

  // Inject content security headers as meta tags
  static injectSecurityHeaders(html) {
    const securityMeta = `
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta http-equiv="X-Content-Type-Options" content="nosniff">
      <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
      <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
    `;
    return html.replace(/<head[^>]*>/i, '<head>' + securityMeta);
  }

  // Compress images to reduce bandwidth
  static compressImages(html) {
    return html.replace(/<img([^>]*)>/gi, (match, attrs) => {
      return `<img${attrs} loading="lazy" decoding="async" style="max-width:100%;height:auto;">`;
    });
  }

  // Dark mode theme
  static darkMode(html) {
    const darkStyle = `
      <style>
        html { background: #1a1a1a !important; color: #e0e0e0 !important; }
        body { background: #1a1a1a !important; color: #e0e0e0 !important; }
        a { color: #64b5f6 !important; }
        button, input, select, textarea { background: #2a2a2a !important; color: #e0e0e0 !important; border-color: #444 !important; }
        img { opacity: 0.9; }
        .ad, [class*="ad-"], [id*="ad-"] { display: none !important; }
      </style>
    `;
    return html.replace(/<\/head>/i, darkStyle + '</head>');
  }

  // Remove pop-ups and modals
  static removePopups(html) {
    return html
      .replace(/<script[^>]*src=[^>]*(popup|modal).*?><\/script>/gi, '')
      .replace(/<div[^>]*(role="dialog"|class="[^"]*modal[^"]*"|class="[^"]*popup[^"]*")[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<iframe[^>]*src=[^>]*(popup|modal|ad).*?<\/iframe>/gi, '');
  }

  // Remove annoying notifications and banners
  static removeBanners(html) {
    return html.replace(/<div[^>]*(class="[^"]*notification[^"]*"|class="[^"]*banner[^"]*"|class="[^"]*alert[^"]*")[^>]*>[\s\S]*?<\/div>/gi, '');
  }

  // Inject reader mode styles for better readability
  static readerMode(html) {
    const readerStyle = `
      <style>
        body { max-width: 800px; margin: 0 auto; padding: 20px; font-size: 18px; line-height: 1.8; }
        h1, h2, h3, h4, h5, h6 { margin-top: 30px; margin-bottom: 15px; }
        p { margin-bottom: 15px; }
        img { max-width: 100%; height: auto; margin: 20px 0; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
      </style>
    `;
    return html.replace(/<\/head>/i, readerStyle + '</head>');
  }

  // Block video autoplay
  static blockAutoplay(html) {
    return html
      .replace(/(<video[^>]*)autoplay/gi, '$1')
      .replace(/(<iframe[^>]*)autoplay/gi, '$1')
      .replace(/\bautoplay\s*=\s*["']?true["']?/gi, '');
  }

  // Disable JavaScript (static content only)
  static disableJS(html) {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '');
  }

  // Lazy load all resources
  static lazyLoad(html) {
    return html
      .replace(/<img([^>]*)>/gi, (match, attrs) => {
        if (!attrs.includes('loading=')) {
          return `<img${attrs} loading="lazy">`;
        }
        return match;
      })
      .replace(/<iframe([^>]*)>/gi, (match, attrs) => {
        if (!attrs.includes('loading=')) {
          return `<iframe${attrs} loading="lazy">`;
        }
        return match;
      });
  }

  // Remove cookies and local storage scripts
  static removeCookies(html) {
    return html
      .replace(/<script[^>]*src=[^>]*(cookie|tracking).*?><\/script>/gi, '')
      .replace(/<script>[\s\S]*?document\.cookie[\s\S]*?<\/script>/gi, '');
  }

  // Block third-party resources
  static blockThirdParty(html) {
    return html
      .replace(/<script[^>]*src=[^>]*(?:https?:)?\/\/[^>]*(?<!localhost)[^>]*>/gi, '')
      .replace(/<link[^>]*href=[^>]*(?:https?:)?\/\/[^>]*(?<!localhost)[^>]*>/gi, '')
      .replace(/<iframe[^>]*src=[^>]*(?:https?:)?\/\/[^>]*(?<!localhost)[^>]*>/gi, '');
  }

  // Apply extension based on user preference
  static apply(html, extensions = []) {
    let result = html;
    extensions.forEach(ext => {
      if (ext === 'adblock') result = this.blockAds(result);
      if (ext === 'tracking') result = this.stripTracking(result);
      if (ext === 'privacy') result = this.stripPrivacy(result);
      if (ext === 'malware') result = this.blockMalicious(result);
      if (ext === 'security') result = this.injectSecurityHeaders(result);
      if (ext === 'images') result = this.compressImages(result);
      if (ext === 'darkmode') result = this.darkMode(result);
      if (ext === 'nopopup') result = this.removePopups(result);
      if (ext === 'nobanner') result = this.removeBanners(result);
      if (ext === 'reader') result = this.readerMode(result);
      if (ext === 'noautoplay') result = this.blockAutoplay(result);
      if (ext === 'nojs') result = this.disableJS(result);
      if (ext === 'lazyload') result = this.lazyLoad(result);
      if (ext === 'nocookie') result = this.removeCookies(result);
      if (ext === 'nothirdparty') result = this.blockThirdParty(result);
    });
    return result;
  }
}

module.exports = ProxyExtensions;
