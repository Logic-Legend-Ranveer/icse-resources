/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export interface Env {
  GITHUB_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    let path = url.pathname;
    if (path === "/" || path === "") {
      path = "/index.html";
    }

    // Replace with your GitHub username
    const githubUrl = `https://raw.githubusercontent.com/Logic-Legend-Ranveer/icse-resources/main${path}`;

    // Setup fetch options with optional PAT authentication
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Cloudflare-Worker'
    };
    if (env.GITHUB_TOKEN) {
      fetchHeaders['Authorization'] = `token ${env.GITHUB_TOKEN}`;
    }

    const response = await fetch(githubUrl, { headers: fetchHeaders });

    if (response.status === 404) {
      return new Response(`File not found: ${path}`, { status: 404 });
    }

    const newHeaders = new Headers(response.headers);
    
    // 1. Fully disable CSP and Sandboxing so Canvas & Scripts can run freely
    newHeaders.delete('Content-Security-Policy');
    newHeaders.delete('Content-Security-Policy-Report-Only');
    newHeaders.delete('X-Content-Security-Policy');
    newHeaders.delete('Content-Encoding'); // Let Cloudflare handle compression

    // 2. Allow CORS and frame access
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    // 3. Strict Content-Type dictionary
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.css':  'text/css; charset=utf-8',
      '.js':   'application/javascript; charset=utf-8',
      '.mjs':  'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.pdf':  'application/pdf',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg':  'image/svg+xml',
      '.webp': 'image/webp',
      '.ico':  'image/x-icon',
      '.woff2': 'font/woff2',
      '.ttf':  'font/ttf'
    };

    for (const [ext, type] of Object.entries(mimeTypes)) {
      if (path.toLowerCase().endsWith(ext)) {
        newHeaders.set('Content-Type', type);
        break;
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
};