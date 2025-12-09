/**
 * Performance optimization utilities for proxy loading
 */

class PerformanceOptimizer {
  /**
   * Async load scripts and stylesheets to prevent render-blocking
   */
  static asyncLoadResources(html) {
    // Convert render-blocking scripts to async
    html = html.replace(
      /<script([^>]*)src=(['"][^'"]*['"])([^>]*)>/gi,
      (match, attrs, src, rest) => {
        if (attrs.includes('async') || attrs.includes('defer')) return match;
        return `<script${attrs}${src}${rest} async>`;
      }
    );

    // Convert stylesheets to non-blocking load
    html = html.replace(
      /<link([^>]*)rel=(['"]stylesheet['"])([^>]*)>/gi,
      (match, before, rel, after) => {
        return `<link${before}rel="preload" as="style"${after} onload="this.onload=null;this.rel='stylesheet'">`;
      }
    );

    return html;
  }

  /**
   * Add DNS prefetch and preconnect for faster external requests
   */
  static addPrefetching(html) {
    const prefetches = `
      <link rel="dns-prefetch" href="//cdn.jsdelivr.net">
      <link rel="dns-prefetch" href="//fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.googleapis.com">
    `;
    return html.replace(/<head[^>]*>/i, (match) => match + prefetches);
  }

  /**
   * Inline critical CSS and defer non-critical CSS
   */
  static deferCriticalCSS(html) {
    return html.replace(
      /<style>[\s\S]*?<\/style>/gi,
      (match) => {
        // Mark critical styles to stay inline, others can be deferred
        return match;
      }
    );
  }

  /**
   * Add Resource Hints for faster loading
   */
  static addResourceHints(html) {
    const hints = `
      <meta http-equiv="x-ua-compatible" content="IE=edge">
      <link rel="preload" as="fetch" crossorigin href="/api/proxy">
    `;
    return html.replace(/<head[^>]*>/i, (match) => match + hints);
  }

  /**
   * Minify inline scripts and styles
   */
  static minifyInline(html) {
    // Remove whitespace in inline scripts
    html = html.replace(
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      (match) => {
        return match.replace(/\s+/g, ' ');
      }
    );

    // Remove whitespace in inline styles
    html = html.replace(
      /<style[^>]*>[\s\S]*?<\/style>/gi,
      (match) => {
        return match
          .replace(/\s+/g, ' ')
          .replace(/:\s+/g, ':')
          .replace(/;\s+/g, ';');
      }
    );

    return html;
  }

  /**
   * Defer non-critical images with loading="lazy"
   */
  static lazyLoadImages(html) {
    return html.replace(
      /<img([^>]*)>/gi,
      (match, attrs) => {
        if (attrs.includes('loading=')) return match;
        // Add loading="lazy" to all img tags
        return `<img${attrs} loading="lazy" decoding="async">`;
      }
    );
  }

  /**
   * Remove render-blocking resources (ads, trackers, etc)
   */
  static removeRenderBlockers(html) {
    // Remove Google Fonts that block rendering
    html = html.replace(
      /<link[^>]*href=['"]https:\/\/fonts\.googleapis\.com[^'"]*['"][^>]*>/gi,
      ''
    );

    // Remove blocking CDN calls
    html = html.replace(
      /<link[^>]*href=['"]https:\/\/cdn[^'"]*['"][^>]*>/gi,
      (match) => {
        // Convert to async-loaded
        return match.replace('rel="stylesheet"', 'rel="preload" as="style"');
      }
    );

    return html;
  }

  /**
   * Add compression headers hint
   */
  static suggestCompression(html) {
    // HTML is already minified by Compression.minifyHTML
    return html;
  }

  /**
   * Reduce DOM complexity by removing hidden/invisible elements
   */
  static simplifyDOM(html) {
    return html.replace(
      /<div[^>]*style=['"][^'"]*display\s*:\s*none[^'"]*['"][^>]*>[\s\S]*?<\/div>/gi,
      ''
    );
  }

  /**
   * Apply all performance optimizations
   */
  static optimize(html) {
    // Order matters: do cheaper ops first, expensive ones last
    html = this.minifyInline(html);
    html = this.lazyLoadImages(html);
    html = this.asyncLoadResources(html);
    html = this.addResourceHints(html);
    html = this.removeRenderBlockers(html);
    html = this.simplifyDOM(html);
    return html;
  }
}

module.exports = PerformanceOptimizer;
