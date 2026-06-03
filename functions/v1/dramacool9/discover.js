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
    let apiKey, page = "1", country, genre;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      page = body.page || page;
      country = body.country;
      genre = body.genre;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      page = url.searchParams.get("page") || page;
      country = url.searchParams.get("country");
      genre = url.searchParams.get("genre");
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    let fetchUrl = BASE;
    if (country) fetchUrl += "/country/" + country;
    else if (genre) fetchUrl += "/genre/" + genre;
    fetchUrl += "/";

    if (page !== "1") fetchUrl += "page/" + page + "/";

    const { data: html } = await axios.get(fetchUrl, { headers: HEADERS });
    const $ = cheerio.load(html);

    const items = [];
    $(".box li").each((_, el) => {
      const a = $(el).find("a.mask, a").first();
      const href = a.attr("href") || "";
      const title = $(el).find("h3").text().trim();
      const image = $(el).find("img").attr("data-original") || $(el).find("img").attr("src") || null;
      const ep = $(el).find(".ep").text().trim();
      const time = $(el).find(".time").text().trim();
      items.push({ title, id: cleanId(href), image, episode: ep || null, time: time || null });
    });

    let hasNext = false, hasPrev = false, maxPage = 1;
    $(".nav-links .page-numbers").each((_, el) => {
      if ($(el).hasClass("next")) hasNext = true;
      if ($(el).hasClass("prev")) hasPrev = true;
      if (!$(el).hasClass("next") && !$(el).hasClass("prev") && !$(el).hasClass("current") && !$(el).hasClass("dots")) {
        const num = parseInt($(el).text());
        if (num > maxPage) maxPage = num;
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: items,
      pagination: { nextpage: hasNext, prevpage: hasPrev, maxpage: maxPage },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
