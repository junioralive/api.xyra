import * as cheerio from "cheerio";
import axios from "axios";

function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",").map((k) => k.trim());
  return validApiKeys.includes(apiKey);
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
  Referer: "https://dramacool.sh/",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function parseEpisodeList($, selector) {
  const dramas = [];
  $(selector).each((_, el) => {
    const title = $(el).find("h3").text().trim();
    const rawHref = $(el).find("a").first().attr("href") || "";
    const image =
      $(el).find("img").attr("data-original") ||
      $(el).find("img").attr("data-src") ||
      $(el).find("img").attr("src") || "";
    const episode = $(el).find(".ep").text().trim();
    const time = $(el).find(".time").text().trim();

    if (!title || !rawHref) return;

    const original_id = rawHref
      .replace("https://dramacool.sh", "")
      .replace(/^\//, "")
      .replace(/\/$/, "");
    const id = original_id.replace(/-episode-\d+.*/i, "");

    dramas.push({ title, id, original_id, image, episode, time });
  });
  return dramas;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  let apiKey = null, page = "1";

  if (request.method === "POST") {
    const ct = request.headers.get("Content-Type") || "";
    if (!ct.includes("application/json")) return json({ success: false, message: "Use application/json" }, 400);
    const body = await request.json().catch(() => ({}));
    apiKey = body.api_key;
    page = body.page || page;
  } else if (request.method === "GET") {
    const url = new URL(request.url);
    apiKey = url.searchParams.get("api_key");
    page = url.searchParams.get("page") || page;
  } else {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  if (!apiKey || !validateApiKey(apiKey, env)) {
    return json({ success: false, message: "Invalid or missing API key.", protip: "Join our Discord → https://discord.gg/cwDTVKyKJz" }, 401);
  }

  // Try multiple K-drama category URLs — DramaCool changes these occasionally
  const candidateUrls = [
    `https://dramacool.sh/category/korean-drama/page/${page}/`,
    `https://dramacool.sh/category/latest-korean-drama/page/${page}/`,
    `https://dramacool.sh/category/kdrama/page/${page}/`,
    // Fallback: use the main latest page and extract from it
    `https://dramacool.sh/category/latest-asian-drama-releases/page/${page}/`,
  ];

  let lastError = null;
  for (const targetUrl of candidateUrls) {
    try {
      const response = await axios.get(targetUrl, { headers: HEADERS, validateStatus: (s) => s < 400 });
      const $ = cheerio.load(response.data);

      // Try different selectors
      let dramas = parseEpisodeList($, "#primary.episode-category.wrapper .box li");
      if (dramas.length === 0) dramas = parseEpisodeList($, ".box li");

      if (dramas.length === 0) continue; // try next URL

      const hasNext = !!$(".pagination .next.page-numbers").attr("href");
      const hasPrev = !!$(".pagination .prev.page-numbers").attr("href");
      const maxPageText = $(".pagination .page-numbers").not(".dots,.prev,.next,.current").last().text();

      return json({
        success: true,
        data: dramas,
        source_url: targetUrl,
        pagination: {
          nextpage: hasNext,
          prevpage: hasPrev,
          maxpage: parseInt(maxPageText) || 1,
        },
      });
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  // All URLs failed — fall back to home page #drama section
  try {
    const response = await axios.get("https://dramacool.sh/", { headers: HEADERS });
    const $ = cheerio.load(response.data);
    const dramas = parseEpisodeList($, "#drama .box li");

    return json({
      success: true,
      data: dramas,
      source_url: "https://dramacool.sh/ (#drama section)",
      pagination: { nextpage: false, prevpage: false, maxpage: 1 },
    });
  } catch (err) {
    return json({ success: false, error: "Failed to fetch K-drama data.", detail: err.message }, 500);
  }
}
