import * as cheerio from "cheerio";
import axios from "axios";

const BASE = "https://kisskh.dk";

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

    const fetchUrl = page !== "1"
      ? `${BASE}/page/${page}/?s=${encodeURIComponent(query)}`
      : `${BASE}/?s=${encodeURIComponent(query)}`;

    const { data: html } = await axios.get(fetchUrl, { headers: HEADERS });
    const $ = cheerio.load(html);

    const results = [];
    $(".listupd article").each((_, el) => {
      const a = $(el).find(".bsx > a");
      const title = $(el).find(".tt h2").text().trim();
      const link = a.attr("href");
      const image = $(el).find(".bsx img").attr("src") || $(el).find(".bsx img").attr("data-src");
      const status = $(el).find(".limit .status").text().trim() || "Ongoing";
      const episode = $(el).find(".bt .epx").text().trim();
      const subtitle = $(el).find(".bt .sb").text().trim();

      if (title) {
        results.push({ title, link, image, status, episode, subtitle });
      }
    });

    // Pagination
    let hasNext = false, hasPrev = false, maxPage = 1;
    $(".pagination .page-numbers").each((_, el) => {
      if ($(el).hasClass("next")) hasNext = true;
      if ($(el).hasClass("prev")) hasPrev = true;
      const num = parseInt($(el).text());
      if (!$(el).hasClass("next") && !$(el).hasClass("prev") && !$(el).hasClass("current") && !$(el).hasClass("dots") && num > maxPage) maxPage = num;
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
