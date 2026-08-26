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

    // 1. If path is empty (root URL), fetch and serve your index.html from GitHub
    if (!path || path === "") {
      const htmlUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/index.html`;
      const htmlResponse = await fetch(htmlUrl, {
        headers: {
          "User-Agent": "Cloudflare-Worker-Proxy",
          "Authorization": `token ${env.GITHUB_TOKEN}`
        }
      });

      return new Response(htmlResponse.body, {
        status: htmlResponse.status,
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 2. Otherwise, proxy folder/file content requests to the GitHub API safely
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