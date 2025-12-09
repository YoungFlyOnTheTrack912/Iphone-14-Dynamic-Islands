# Simple Web Proxy

This is a minimal Node.js-based web proxy that fetches remote pages and rewrites links so pages are served from the proxy origin. Because pages are served from the proxy's origin and the proxy strips restrictive CSP headers, bookmarklets can run on proxied pages.

WARNING: This proxy forwards arbitrary external content through your machine. Use only for testing and development. Do not use it to bypass paywalls, access private resources you don't own, or other abusive activity.

## Setup

1. Install dependencies:

```bash
cd /workspaces/Iphone-14-Dynamic-Islands
npm install
```

2. Start the server:

```bash
npm start
# or: node server.js
```

3. Open the UI in your browser:

```
http://localhost:3000/proxy.html
```

4. Enter a URL (including scheme, e.g. `https://example.com`) and open it. The proxied site will load under the proxy origin (http://localhost:3000/proxy?url=...).

## Notes
- The proxy rewrites HTML links and resource URLs to route through `/proxy?url=` so navigation and resources keep loading via the proxy.
- The proxy strips upstream Content-Security-Policy meta tags and sets a permissive CSP header to allow inline scripts/bookmarklets. This weakens security for the proxied content — do not use this in production.
- Non-HTML responses (images, scripts, CSS) are streamed through unchanged.

If you want, I can start the Node server for you now and open the page in your host browser.
