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

    const results = [];
    const blockRegex = /<a[^>]*href="(https:\/\/new3\.moviesdrives\.my\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = blockRegex.exec(html)) !== null) {
      const link = match[1];
      const block = match[2];
      if (!block.includes("poster-card")) continue;

      const titleMatch = block.match(/poster-title[^>]*>([\s\S]*?)<\/p>/i);
      const title = titleMatch ? titleMatch[1].replace(/&#8211;/g, "-").trim() : null;
      const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);
      const image = imgMatch ? imgMatch[1] : null;
      const qualityMatch = block.match(/poster-quality[^>]*>([^<]+)</i);

      if (title && link) {
        results.push({
          title,
          id: link.replace(BASE + "/", "").replace(/\/$/, ""),
          link,
          image,
          quality: qualityMatch ? qualityMatch[1].trim() : null,
          type: /season|series|episode/i.test(title) ? "series" : "movie",
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      query,
      data: results,
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
