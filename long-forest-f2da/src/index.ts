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
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, ""); // Removes leading slashes

    const username = "Logic-Legend-Ranveer";
    const repo = "icse-resources";
    const branch = "main";

    // Common MIME types for raw file requests
    const mimeTypes: Record<string, string> = {
      xml: "application/xml; charset=UTF-8",
      html: "text/html; charset=UTF-8",
      txt: "text/plain; charset=UTF-8",
      json: "application/json; charset=UTF-8",
      css: "text/css; charset=UTF-8",
      js: "application/javascript; charset=UTF-8",
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
    };

    // 1. Root URL -> Fetch index.html
    if (!path || path === "") {
      const htmlUrl = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/index.html`;
      const htmlResponse = await fetch(htmlUrl, {
        headers: {
          "User-Agent": "Cloudflare-Worker-Proxy",
          "Authorization": `token ${env.GITHUB_TOKEN}`
        }
      });

      return new Response(htmlResponse.body, {
        status: htmlResponse.status,
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Extract file extension if present
    const extMatch = path.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : null;

    // 2. Direct File Requests (e.g., sitemap.xml, robots.txt, images, PDFs)
    if (ext && mimeTypes[ext]) {
      const rawFileUrl = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${path}`;
      const fileResponse = await fetch(rawFileUrl, {
        headers: {
          "User-Agent": "Cloudflare-Worker-Proxy",
          "Authorization": `token ${env.GITHUB_TOKEN}`
        }
      });

      return new Response(fileResponse.body, {
        status: fileResponse.status,
        headers: {
          "Content-Type": mimeTypes[ext],
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    // 3. Folder/Directory Listings -> GitHub API JSON
    const githubApiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
    const githubResponse = await fetch(githubApiUrl, {
      headers: {
        "User-Agent": "Cloudflare-Worker-Proxy",
        "Authorization": `token ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    return new Response(githubResponse.body, {
      status: githubResponse.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};