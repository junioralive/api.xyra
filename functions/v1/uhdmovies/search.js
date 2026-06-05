import axios from "axios";

const BASE = "https://uhdmovies.rodeo";

function validateApiKey(apiKey, env) {
  return (env.API_KEYS || "").split(",").map(k => k.trim()).includes(apiKey);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    let apiKey, query, page;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      query = body.query;
      page = body.page || 1;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      query = url.searchParams.get("query");
      page = parseInt(url.searchParams.get("page")) || 1;
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (!query) {
      return new Response(JSON.stringify({ success: false, message: "Missing query parameter." }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const searchUrl = `${BASE}/page/${page}/?s=${encodeURIComponent(query)}`;
    const { data: html } = await axios.get(searchUrl, { headers: { ...HEADERS } });

    const articleRegex = /<article([^>]*)>([\s\S]*?)<\/article>/gi;
    const results = [];
    let match;

    while ((match = articleRegex.exec(html)) !== null) {
      const tagAttrs = match[1];
      const block = match[2];

      const allLinks = block.match(/href="(https:\/\/uhdmovies\.rodeo\/[^"]+?)"/gi);
      let link = null;
      if (allLinks) {
        for (const l of allLinks) {
          const href = l.replace(/href="|"/g, "");
          if (!href.includes("feed") && !href.includes("#respond")) {
            link = href;
            break;
          }
        }
      }
      if (!link) continue;

      const titleMatch = block.match(/class="sanket"[^>]*>([^<]+)<\/h1>/i)
        || block.match(/<h1[^>]*>([^<]+)<\/h1>/i)
        || block.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      const title = titleMatch ? titleMatch[1].replace(/^Download\s+/i, "").trim() : null;

      const imgMatch = block.match(/<img[^>]*src="(https:\/\/[^"]+(?:jpg|png|webp))"/i);
      const image = imgMatch ? imgMatch[1] : null;

      const cats = [];
      const catMatches = tagAttrs.match(/category-([a-z0-9-]+)/gi);
      if (catMatches) {
        catMatches.forEach(c => {
          const name = c.replace("category-", "").replace(/-/g, " ");
          if (!cats.includes(name)) cats.push(name);
        });
      }

      if (title && link) {
        results.push({
          title,
          id: link.replace(BASE + "/", "").replace(/\/$/, ""),
          link,
          image,
          categories: cats,
          type: /season|series|episode/i.test(title) ? "series" : "movie",
        });
      }
    }

    const hasNext = /gridlove-pagination.*?class="next"/i.test(html);

    return new Response(JSON.stringify({
      success: true,
      query,
      data: results,
      pagination: { page, has_next: hasNext },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
