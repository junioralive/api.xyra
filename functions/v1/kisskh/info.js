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

function getSpeSpan($, label) {
  let val = null;
  $(".spe span").each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith(label)) val = text.replace(label, "").trim();
  });
  return val;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    let apiKey, id;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      id = body.id;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      id = url.searchParams.get("id");
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: "Missing id parameter." }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Try series URL then direct episode URL
    const seriesUrl = `${BASE}/series/${id}/`;
    const { data: html } = await axios.get(seriesUrl, { headers: HEADERS, validateStatus: s => s < 400 });
    const $ = cheerio.load(html);

    const title = $(".entry-title").first().text().trim();
    const thumbnail = $("img.ts-post-image").first().attr("src")
      || $("img.attachment-post-thumbnail").first().attr("src")
      || $("img.wp-post-image").first().attr("data-src")
      || null;
    const alter = $(".alter").text().trim() || null;

    // Metadata from .spe spans
    const status = getSpeSpan($, "Status:");
    const network = [];
    $(".spe span").each((_, el) => { if ($(el).text().trim().startsWith("Network:")) $(el).find("a").each((__, a) => network.push($(a).text().trim())); });
    const duration = getSpeSpan($, "Duration:");
    const country = [];
    $(".spe span").each((_, el) => { if ($(el).text().trim().startsWith("Country:")) $(el).find("a").each((__, a) => country.push($(a).text().trim())); });
    const totalEpisodes = getSpeSpan($, "Episodes:");
    const director = [];
    $(".spe span").each((_, el) => { if ($(el).text().trim().startsWith("Director:")) $(el).find("a").each((__, a) => director.push($(a).text().trim())); });
    const casts = [];
    $(".spe span").each((_, el) => { if ($(el).text().trim().startsWith("Casts:")) $(el).find("a").each((__, a) => casts.push($(a).text().trim())); });

    // Genres
    const genres = $(".genxed a").map((_, el) => $(el).text().trim()).get();

    // Synopsis
    const synopsis = $(".entry-content").text().trim() || null;

    // Episode list
    const episodes = [];
    $(".eplister li").each((_, el) => {
      const a = $(el).find("a");
      episodes.push({
        number: $(el).find(".epl-num").text().trim(),
        title: $(el).find(".epl-title").text().trim(),
        sub: $(el).find(".epl-sub .status").text().trim() || null,
        date: $(el).find(".epl-date").text().trim() || null,
        link: a.attr("href") || null,
      });
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        title,
        thumbnail,
        other_name: alter,
        status,
        network: network.length ? network : null,
        duration,
        country: country.length ? country : null,
        episodes_total: totalEpisodes,
        director: director.length ? director : null,
        casts: casts.length ? casts : null,
        genres,
        synopsis,
        episodes,
      },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
