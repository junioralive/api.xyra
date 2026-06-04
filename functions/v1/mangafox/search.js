import * as cheerio from "cheerio";
import axios from "axios";

const BASE = "https://fanfox.net";

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

function getProxyImageUrl(imageUrl, baseUrl) {
  if (!imageUrl) return imageUrl;
  try {
    const proxyUrl = new URL("/v1/mangafox/image-proxy", baseUrl);
    proxyUrl.searchParams.append("url", imageUrl);
    return proxyUrl.toString();
  } catch {
    return imageUrl;
  }
}

function convertStarsToRating(starElements, $) {
  let rating = 0;
  starElements.each((_, element) => {
    const src = $(element).attr("src");
    if (src && src.includes("star-10")) rating += 1;
  });
  return rating;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const baseUrl = new URL(request.url).origin;
    let apiKey, query;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      query = body.query;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      query = url.searchParams.get("query");
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (!query) {
      return new Response(JSON.stringify({ success: false, message: "Missing query parameter." }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const { data: html } = await axios.get(`${BASE}/search?title=${encodeURIComponent(query)}`, { headers: HEADERS });
    const $ = cheerio.load(html);

    const results = [];
    $(".manga-list-4 li").each((_, el) => {
      const $li = $(el);
      const title = $li.find(".manga-list-4-item-title a").text().trim();
      const link = $li.find(".manga-list-4-item-title a").attr("href");
      const id = link ? link.split("/manga/")[1]?.split("/")[0] : null;
      const imageUrl = $li.find(".manga-list-4-cover").attr("src");
      const subtitle = $li.find(".manga-list-4-item-subtitle").text().trim();
      const stars = $li.find(".item-star");
      const rating = convertStarsToRating(stars, $);
      const score = $li.find(".item-score").text().trim();
      const genres = [];
      $li.find(".manga-list-4-show-tag-list a").each((_, g) => genres.push($(g).text().trim()));

      if (title) {
        results.push({
          title,
          id,
          link,
          image: getProxyImageUrl(imageUrl, baseUrl),
          image_original: imageUrl,
          subtitle,
          rating,
          score: parseFloat(score) || 0,
          genres,
        });
      }
    });

    return new Response(JSON.stringify({ success: true, query, data: results }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
