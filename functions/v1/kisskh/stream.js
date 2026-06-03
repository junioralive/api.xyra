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
    let apiKey, episodeId;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      episodeId = body.episode_id;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      episodeId = url.searchParams.get("episode_id");
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (!episodeId) {
      return new Response(JSON.stringify({ success: false, message: "Missing episode_id parameter." }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const episodeUrl = `${BASE}/${episodeId}/`;
    const { data: html } = await axios.get(episodeUrl, { headers: HEADERS });
    const $ = cheerio.load(html);

    const title = $(".entry-title").first().text().trim();

    // Extract iframe embed URL
    let embedUrl = null;
    const iframe = $("#embed_holder iframe, #pembed iframe, .video-content iframe").first();
    if (iframe.length) {
      embedUrl = iframe.attr("data-litespeed-src") || iframe.attr("src") || null;
      if (embedUrl && embedUrl.startsWith("about:blank")) embedUrl = null;
    }

    // Series info from sidebar
    const seriesTitle = $(".infox h2").first().text().trim();
    const seriesLink = $(".infox .thumb a").attr("href") || null;

    // Navigation
    const nav = {};
    $(".naveps .nvsc a, .nav_ep a").each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim().toLowerCase();
      if (!href) return;
      if (text.includes("prev")) nav.prev = href;
      else if (text.includes("next")) nav.next = href;
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        title,
        embed_url: embedUrl,
        series: { title: seriesTitle || null, link: seriesLink },
        navigation: nav,
      },
      episode_url: episodeUrl,
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
