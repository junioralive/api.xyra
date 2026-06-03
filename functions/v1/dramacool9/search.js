import * as cheerio from "cheerio";
import axios from "axios";

const BASE = "https://dramacool9.com.ro";

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
  Referer: BASE + "/",
};

function cleanId(href) {
  return href
    .replace(BASE, "")
    .replace(/\.html?$/, "")
    .replace(/\/$/, "")
    .replace(/^\//, "")
    .replace(/-episode-\d+$/i, "");
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    let apiKey, query, page = "1";

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      query = body.query;
      page = body.page || page;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      query = url.searchParams.get("query");
      page = url.searchParams.get("page") || page;
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (!query) {
      return new Response(JSON.stringify({ success: false, message: "Missing query parameter." }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const searchUrl = page !== "1"
      ? `${BASE}/page/${page}/?s=${encodeURIComponent(query)}`
      : `${BASE}/?s=${encodeURIComponent(query)}`;

    const { data: html } = await axios.get(searchUrl, { headers: HEADERS });
    const $ = cheerio.load(html);

    const results = [];
    $(".box li").each((_, el) => {
      const a = $(el).find("a.mask, a").first();
      const href = a.attr("href") || "";
      const title = $(el).find("h3").text().trim();
      const image = $(el).find("img").attr("data-original") || $(el).find("img").attr("src") || null;
      const time = $(el).find(".time").text().trim();
      const id = cleanId(href);

      if (title) {
        results.push({ title, id, image, time: time || null });
      }
    });

    // Pagination from nav-links
    let hasNext = false, hasPrev = false, maxPage = 1;
    $(".nav-links .page-numbers").each((_, el) => {
      const href = $(el).attr("href");
      if ($(el).hasClass("next")) hasNext = true;
      if ($(el).hasClass("prev")) hasPrev = true;
      if (!$(el).hasClass("next") && !$(el).hasClass("prev") && !$(el).hasClass("current") && !$(el).hasClass("dots")) {
        const num = parseInt($(el).text());
        if (num > maxPage) maxPage = num;
      }
    });

    return new Response(JSON.stringify({
      success: true,
      query,
      page: parseInt(page),
      data: results,
      pagination: { hasNext, hasPrev, maxPage },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
