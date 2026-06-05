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

function cleanTitle(text) {
  return text.replace(/^Download\s+/i, "").trim();
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    let apiKey, page;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      page = body.page || 1;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      page = parseInt(url.searchParams.get("page")) || 1;
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const pageUrl = page > 1 ? `${BASE}/page/${page}/` : BASE + "/";
    const { data: html } = await axios.get(pageUrl, { headers: { ...HEADERS } });

    // Regex-based extraction
    const articleRegex = /<article([^>]*)>([\s\S]*?)<\/article>/gi;
    const posts = [];
    let match;

    while ((match = articleRegex.exec(html)) !== null) {
      const tagAttrs = match[1];
      const block = match[2];
      // Extract first link that points to a post
      const allLinks = block.match(/href="(https:\/\/uhdmovies\.rodeo\/[^"]+?)"/gi);
      let link = null;
      if (allLinks) {
        for (const l of allLinks) {
          const href = l.replace(/href="|"/g, "");
          if (!href.includes("feed") && !href.includes("#respond") && !href.includes("xmlrpc")) {
            link = href;
            break;
          }
        }
      }
      if (!link) continue;

      // Extract title from h1.sanket or first h1/h2 text
      const titleMatch = block.match(/class="sanket"[^>]*>([^<]+)<\/h1>/i)
        || block.match(/<h1[^>]*>([^<]+)<\/h1>/i)
        || block.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      const title = titleMatch ? cleanTitle(titleMatch[1]) : null;

      // Extract image
      const imgMatch = block.match(/<img[^>]*src="(https:\/\/[^"]+(?:jpg|png|webp))"/i);
      const image = imgMatch ? imgMatch[1] : null;

      // Categories from article tag class
      const cats = [];
      const catMatches = tagAttrs.match(/category-([a-z0-9-]+)/gi);
      if (catMatches) {
        catMatches.forEach(c => {
          const name = c.replace("category-", "").replace(/-/g, " ");
          if (!cats.includes(name)) cats.push(name);
        });
      }

      if (title && link) {
        posts.push({
          title,
          id: link.replace(BASE + "/", "").replace(/\/$/, ""),
          link,
          image,
          categories: cats,
          type: /season|series|episode/i.test(title) ? "series" : "movie",
          quality_tags: cats.filter(c => /\d{3,4}p|4k|hdr|hevc/i.test(c)),
        });
      }
    }

    const hasNext = /gridlove-pagination.*?class="next"/i.test(html);
    const pageNumMatch = html.match(/page-numbers[^>]*>(\d+)</g);
    const totalPages = pageNumMatch ? parseInt(pageNumMatch[pageNumMatch.length - 1].match(/\d+/)[0]) : null;

    return new Response(JSON.stringify({
      success: true,
      data: {
        posts,
        pagination: { current_page: page, total_pages: totalPages, has_next: hasNext },
      },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
