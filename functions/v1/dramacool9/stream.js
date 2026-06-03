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

async function extractStream(embedUrl) {
  try {
    const { data: html } = await axios.get(embedUrl, { headers: { ...HEADERS, Referer: BASE + "/" }, timeout: 10000 });
    const $ = cheerio.load(html);

    // Try to find m3u8 in scripts
    const scripts = $("script").map((_, el) => $(el).html() || "").get().join("\n");

    // Method 1: eval(function(p,a,c,k,e,d) packed JS
    const packedMatch = scripts.match(/eval\(function\(p,a,c,k,e,d\)\{.*?\}\('.*?',\d+,\d+,'(.*?)'\.split\('\|'\)\)/);
    if (packedMatch) {
      // Simple extraction
      const m3u8 = scripts.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);
      if (m3u8) {
        const vtt = scripts.match(/(https?:\/\/[^"'\s]+\.vtt[^"'\s]*)/);
        return { stream: m3u8[1], sub: vtt ? vtt[1] : null, m3u8: true };
      }
    }

    // Method 2: Direct m3u8 in iframe src or script
    const iframeSrc = $("iframe").attr("src");
    if (iframeSrc && iframeSrc.includes(".m3u8")) {
      return { stream: iframeSrc, sub: null, m3u8: true };
    }

    // Method 3: JWPlayer / direct file URLs in scripts
    const fileMatch = scripts.match(/file:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (fileMatch) {
      return { stream: fileMatch[1], sub: null, m3u8: true };
    }

    return { embed_only: true };
  } catch (e) {
    return { embed_only: true, error: e.message };
  }
}

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

    const episodeUrl = `${BASE}/${episodeId}.html`;
    const { data: html } = await axios.get(episodeUrl, { headers: HEADERS });
    const $ = cheerio.load(html);

    const servers = {};
    let hasM3u8 = false;

    // Parse server buttons
    $(".server-btn").each((_, el) => {
      const dataSrc = $(el).attr("data-src");
      const serverName = $(el).text().trim() || "unknown";

      if (dataSrc) {
        servers[serverName] = { embeded_link: dataSrc, m3u8: false };
      }
    });

    // Try to extract m3u8 from the first server
    const serverKeys = Object.keys(servers);
    if (serverKeys.length > 0) {
      const firstServer = serverKeys[0];
      const result = await extractStream(servers[firstServer].embeded_link);
      servers[firstServer] = { ...servers[firstServer], ...result };
      if (result.m3u8) hasM3u8 = true;
    }

    // Get drama info from the episode page
    const title = $("#drama-details .drama-details h1").text().trim();
    const thumbnail = $("#drama-details .drama-thumbnail img").attr("src") || null;

    // Next/prev episode navigation
    const nav = {};
    const prevBtn = $(".navi_prev a");
    const nextBtn = $(".navi_next a");
    if (prevBtn.length) nav.prev = prevBtn.attr("href");
    if (nextBtn.length) nav.next = nextBtn.attr("href");

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: title || null,
        thumbnail,
        servers,
        navigation: nav,
      },
      episode_url: episodeUrl,
      has_m3u8: hasM3u8,
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
