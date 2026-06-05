import axios from "axios";

const BASE = "https://new3.moviesdrives.my";

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

    const posts = [];
    // Structure: <a href="POST_URL"><div class="poster-card"> ... </div></a>
    const blockRegex = /<a[^>]*href="(https:\/\/new3\.moviesdrives\.my\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = blockRegex.exec(html)) !== null) {
      const link = match[1];
      const block = match[2];

      if (!block.includes("poster-card")) continue;

      const titleMatch = block.match(/poster-title[^>]*>([\s\S]*?)<\/p>/i);
      const title = titleMatch ? titleMatch[1].replace(/&#8211;/g, "-").trim() : null;

      const imgMatch = block.match(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/i);
      const image = imgMatch ? imgMatch[1] : block.match(/<img[^>]*src="([^"]+)"/i)?.[1] || null;
      const alt = imgMatch ? imgMatch[2] : null;

      const qualityMatch = block.match(/poster-quality[^>]*>([^<]+)</i);
      const quality = qualityMatch ? qualityMatch[1].trim() : null;

      const finalTitle = title || (alt ? alt.replace(/&#8211;/g, "-").trim() : null);

      if (finalTitle && link) {
        posts.push({
          title: finalTitle,
          id: link.replace(BASE + "/", "").replace(/\/$/, ""),
          link,
          image,
          quality,
          type: /season|series|episode/i.test(finalTitle) ? "series" : "movie",
        });
      }
    }

    const hasNext = /class="next"/i.test(html);
    const pageNums = html.match(/page-numbers[^>]*>(\d+)</g);
    const totalPages = pageNums ? parseInt(pageNums[pageNums.length - 1].match(/\d+/)[0]) : null;

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
