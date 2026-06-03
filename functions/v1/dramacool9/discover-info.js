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

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    let apiKey;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
    } else {
      apiKey = new URL(request.url).searchParams.get("api_key");
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const { data: html } = await axios.get(BASE + "/", { headers: HEADERS });
    const $ = cheerio.load(html);

    const countries = [];
    $(".tab-list.list-country.active ul li a").each((_, el) => {
      countries.push({ name: $(el).attr("title") || $(el).text().trim(), slug: ($(el).attr("href") || "").replace(/.*\/country\//, "").replace(/\/$/, "") });
    });

    const genres = [];
    $(".tab-list.list-genre.active ul li a").each((_, el) => {
      genres.push({ name: $(el).attr("title") || $(el).text().trim(), slug: ($(el).attr("href") || "").replace(/.*\/genre\//, "").replace(/\/$/, "") });
    });

    return new Response(JSON.stringify({
      success: true,
      data: { countries, genres },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
