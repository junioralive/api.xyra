import * as cheerio from "cheerio";
import axios from "axios";

function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",").map((k) => k.trim());
  return validApiKeys.includes(apiKey);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const AXIOS_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  Referer: "https://dramacool.sh/",
};

// ─── Deobfuscator ──────────────────────────────────────────────────────────────

function deobfuscate(p, a, c, k) {
  while (c--) {
    if (k[c]) p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
  }
  return p;
}

/**
 * Extract m3u8 + subtitle URLs from a player page.
 * Handles multiple player types:
 *  1. eval(function(p,a,c,k,e,d)) — packed JS (most DramaCool servers)
 *  2. JWPlayer / StreamWish / FileLions (atob encoded or direct JSON)
 *  3. Direct .m3u8 URL in script tags
 */
function extractM3u8(html) {
  const $ = cheerio.load(html);
  const allScripts = $("script").map((_, el) => $(el).html() || "").get().join("\n");

  // ── Method 1: eval(function(p,a,c,k,e,d)) packer ──────────────────────────
  let packedScript = null;
  $("script").each((_, el) => {
    const src = $(el).html() || "";
    if (src.includes("eval(function(p,a,c,k,e,d)")) { packedScript = src; return false; }
  });

  if (packedScript) {
    const match = packedScript.match(
      /eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.+?)',(\d+),(\d+),'(.+?)'\.split\('\|'\)\)\)/
    );
    if (match) {
      const [, code, radix, size, dict] = match;
      const deobfed = deobfuscate(code, parseInt(radix), parseInt(size), dict.split("|"));
      const stream = (deobfed.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g) || [])[0] || null;
      const sub = (deobfed.match(/(https?:\/\/[^"'\s]+\.vtt[^"'\s]*)/g) || [])[0] || null;
      if (stream) return { stream, sub, m3u8: true };
    }
  }

  // ── Method 2: JWPlayer setup / StreamWish / FileLions ─────────────────────
  // Pattern: file:"https://...m3u8" or sources:[{file:"..."}]
  const jwMatch = allScripts.match(/["']?file["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/) ||
                  allScripts.match(/source\s*=\s*["']([^"']+\.m3u8[^"']*)["']/) ||
                  allScripts.match(/src\s*:\s*["']([^"']+\.m3u8[^"']*)["']/) ||
                  allScripts.match(/(https?:\/\/[^"'\s]+\.m3u8(?:[^"'\s]*)?)/);

  if (jwMatch) {
    const stream = jwMatch[1];
    const sub = (allScripts.match(/["']?file["']?\s*:\s*["']([^"']+\.vtt[^"']*)["']/) || [])[1] || null;
    return { stream, sub, m3u8: true };
  }

  // ── Method 3: atob() encoded content (StreamWish/FileLions style) ──────────
  const atobMatches = allScripts.match(/atob\(["']([A-Za-z0-9+/=]{20,})["']\)/g) || [];
  for (const encoded of atobMatches) {
    try {
      const b64 = encoded.match(/atob\(["']([^"']+)["']\)/)?.[1];
      if (!b64) continue;
      const decoded = Buffer.from(b64, "base64").toString("utf-8");
      const m3u8Match = decoded.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);
      if (m3u8Match) {
        const vttMatch = decoded.match(/(https?:\/\/[^"'\s]+\.vtt[^"'\s]*)/);
        return { stream: m3u8Match[1], sub: vttMatch?.[1] || null, m3u8: true };
      }
    } catch (_) { continue; }
  }

  // ── Method 4: Direct .m3u8 anywhere in scripts ────────────────────────────
  const directMatch = allScripts.match(/(https?:\/\/[^"'\s<>]+\.m3u8(?:[^"'\s<>]*)?)/);
  if (directMatch) {
    const vttDirect = allScripts.match(/(https?:\/\/[^"'\s<>]+\.vtt(?:[^"'\s<>]*)?)/);
    return { stream: directMatch[1], sub: vttDirect?.[1] || null, m3u8: true };
  }

  return { m3u8: false, error: "No stream found (tried packed/jwplayer/atob/direct)" };
}

// ─── Fetch episode page and extract servers ───────────────────────────────────

/**
 * Try to load the DramaCool episode page for the given slug.
 * Returns { html, finalUrl } or throws.
 */
async function fetchEpisodePage(slug) {
  // Try slug as-is first, then with -english-subbed suffix
  const candidates = [
    `https://dramacool.sh/${slug}/`,
    `https://dramacool.sh/${slug}-english-subbed/`,
    `https://dramacool.sh/${slug}-english-sub/`,
  ];

  // Deduplicate (slug may already end with -english-subbed)
  const seen = new Set();
  const unique = candidates.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });

  let lastError = null;
  for (const url of unique) {
    try {
      const res = await axios.get(url, {
        headers: AXIOS_HEADERS,
        maxRedirects: 5,
        validateStatus: (s) => s < 400, // treat 4xx as error
      });
      if (res.status < 400) return { html: res.data, finalUrl: url };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Episode page not found. Last error: ${lastError?.message}`);
}

/**
 * Extract server list from episode HTML using BOTH approaches:
 * 1. Regex approach (backup) — reliable, fast
 * 2. Cheerio #w-server approach (new) — more structured
 */
function extractServersFromHtml(html, baseUrl) {
  const servers = {};

  // ── Approach 1: Regex (from stream_backup.js — very reliable) ──────────────
  const serverRegex =
    /<div[^>]*class="[^"]*serverslist[^"]*([^"]*)"[^>]*data-server="([^"]+)"/gi;
  let match;
  while ((match = serverRegex.exec(html)) !== null) {
    const name = match[1].trim().split(/\s+/)[0].toLowerCase();
    const link = match[2].trim();
    if (name && link) servers[name] = { embeded_link: link, m3u8: false };
  }

  // ── Approach 2: Cheerio #w-server (current stream.js) ──────────────────────
  if (Object.keys(servers).length === 0) {
    const $ = cheerio.load(html);
    $(".serverslist").each((_, el) => {
      const classes = ($(el).attr("class") || "").split(/\s+/);
      const name = classes.find((c) => c !== "serverslist")?.toLowerCase();
      const link = $(el).attr("data-server")?.trim();
      if (name && link) servers[name] = { embeded_link: link, m3u8: false };
    });
  }

  // ── Approach 3: Any data-server attribute ───────────────────────────────────
  if (Object.keys(servers).length === 0) {
    const $ = cheerio.load(html);
    $("[data-server]").each((i, el) => {
      const link = $(el).attr("data-server")?.trim();
      const name = $(el).attr("class")?.split(/\s+/).find((c) => c !== "serverslist") 
                   ?? `server${i}`;
      if (link) servers[name.toLowerCase()] = { embeded_link: link, m3u8: false };
    });
  }

  return servers;
}

/**
 * Given a server URL, fetch the embed page and look for sub-servers
 * in #list-server-more (from stream_backup.js approach).
 */
async function fetchSubServers(serverUrl, embedIframeSrc) {
  const subServers = {};

  // Try the server URL directly (cheerio approach from new stream.js)
  let targetUrl = serverUrl;
  try {
    const serverRes = await axios.get(serverUrl, { headers: AXIOS_HEADERS, maxRedirects: 5 });
    const $srv = cheerio.load(serverRes.data);

    // Look for embedded iframe
    let iframeSrc = null;
    for (const sel of ['iframe[src*="vidbasic"]', 'iframe[src*="embed"]', 'iframe']) {
      iframeSrc = $srv(sel).attr("src");
      if (iframeSrc) break;
    }

    if (iframeSrc) {
      if (iframeSrc.startsWith("/")) iframeSrc = new URL(serverUrl).origin + iframeSrc;
      targetUrl = iframeSrc.trim();
    }
  } catch (_) { /* fall through */ }

  // Fetch the embed iframe / target page for sub-server list
  try {
    const embedRes = await axios.get(targetUrl, {
      headers: { ...AXIOS_HEADERS, Referer: serverUrl },
      maxRedirects: 5,
    });
    const $embed = cheerio.load(embedRes.data);

    $embed("#list-server-more .list-server-items li.linkserver, li.linkserver").each(
      (_, el) => {
        const provider = ($embed(el).attr("data-provider") || "").toLowerCase().replace(/\s+/g, "");
        let link = $embed(el).attr("data-video") || "";
        if (!provider || !link) return;
        if (link.startsWith("/")) link = new URL(targetUrl).origin + link;
        subServers[provider] = { embeded_link: link.trim(), m3u8: false };
      }
    );

    return { subServers, embedUrl: targetUrl };
  } catch (err) {
    return { subServers, embedUrl: targetUrl };
  }
}

/**
 * Detect player type from URL hostname.
 */
function detectPlayerType(url) {
  const host = (new URL(url)).hostname.toLowerCase();
  if (host.includes("streamwish") || host.includes("dwish") || host.includes("wishembed")) return "streamwish";
  if (host.includes("filelions") || host.includes("dlions") || host.includes("lion")) return "filelions";
  if (host.includes("vidbasic")) return "vidbasic";
  return "generic";
}

/**
 * Process a server URL: fetch it, try multiple extraction methods.
 */
async function processServer(serverUrl) {
  try {
    // For StreamWish/FileLions: try their internal sources API first
    const playerType = detectPlayerType(serverUrl);
    
    if (playerType === "streamwish" || playerType === "filelions") {
      // Extract file ID from URL path
      const pathParts = new URL(serverUrl).pathname.split("/").filter(Boolean);
      const fileId = pathParts[pathParts.length - 1];
      
      if (fileId) {
        // Try the embed page directly — these players often expose sources in script tags
        const embedUrl = serverUrl.includes("/e/") ? serverUrl : serverUrl.replace("/v/", "/e/");
        try {
          const embedRes = await axios.get(embedUrl, {
            headers: { ...AXIOS_HEADERS, Referer: "https://dramacool.sh/" },
            maxRedirects: 5,
          });
          const result = extractM3u8(embedRes.data);
          if (result.m3u8) return result;
        } catch (_) {}
      }
    }

    // Generic approach: fetch and extract
    const res = await axios.get(serverUrl, {
      headers: { ...AXIOS_HEADERS, Referer: "https://dramacool.sh/" },
      maxRedirects: 5,
    });
    return extractM3u8(res.data);
  } catch (err) {
    return { m3u8: false, error: `Fetch failed: ${err.message}` };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // ── Parse params ────────────────────────────────────────────────────────────
  let apiKey = null;
  let episodeId = null;

  if (request.method === "POST") {
    const ct = request.headers.get("Content-Type") || "";
    if (!ct.includes("application/json")) {
      return json({ success: false, message: "Use application/json" }, 400);
    }
    try {
      const body = await request.json();
      apiKey = body.api_key;
      episodeId = body.episode_id;
    } catch {
      return json({ success: false, message: "Invalid JSON body" }, 400);
    }
  } else if (request.method === "GET") {
    const url = new URL(request.url);
    apiKey = url.searchParams.get("api_key");
    episodeId = url.searchParams.get("episode_id");
  } else {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  if (!apiKey || !validateApiKey(apiKey, env)) {
    return json({
      success: false,
      message: "Invalid or missing API key.",
      protip: "Join our Discord to get a free key → https://discord.gg/cwDTVKyKJz",
    }, 401);
  }

  if (!episodeId) {
    return json({ success: false, message: "Missing episode_id parameter" }, 400);
  }

  // ── Scrape episode page ──────────────────────────────────────────────────────
  try {
    const { html: episodeHtml, finalUrl } = await fetchEpisodePage(episodeId);

    // Extract top-level servers
    const servers = extractServersFromHtml(episodeHtml, finalUrl);

    if (Object.keys(servers).length === 0) {
      return json({
        success: false,
        error: "No servers found on episode page.",
        episode_url: finalUrl,
        debug: { html_length: episodeHtml.length, snippet: episodeHtml.substring(0, 300) },
      }, 400);
    }

    const SKIP = ["doodstream", "mixdrop", "mp4upload"];
    let embedUrl = null;

    // ── Process each top-level server ────────────────────────────────────────
    for (const [name, data] of Object.entries(servers)) {
      if (SKIP.includes(name)) {
        servers[name].skipped = true;
        continue;
      }

      // For "standard" server: expand into sub-servers
      if (name === "standard") {
        const { subServers, embedUrl: eu } = await fetchSubServers(data.embeded_link, null);
        if (!embedUrl) embedUrl = eu;

        for (const [subName, subData] of Object.entries(subServers)) {
          if (SKIP.includes(subName)) {
            servers[subName] = { ...subData, skipped: true };
            continue;
          }
          const result = await processServer(subData.embeded_link);
          servers[subName] = { ...subData, ...result };
          if (result.stream) servers[subName].stream = result.stream;
        }
        // Also try to extract m3u8 from the standard server itself
        const stdResult = await processServer(data.embeded_link);
        if (stdResult.stream) { servers[name].stream = stdResult.stream; servers[name].m3u8 = true; }
        continue;
      }

      const result = await processServer(data.embeded_link);
      if (result.stream) servers[name].stream = result.stream;
      if (result.sub) servers[name].sub = result.sub;
      servers[name].m3u8 = result.m3u8 ?? false;
      if (result.error) servers[name].error = result.error;
      if (!embedUrl) embedUrl = data.embeded_link;
    }

    const has_m3u8 = Object.values(servers).some((s) => s.m3u8 === true);

    // Mark embed-only servers
    if (!has_m3u8) {
      for (const [name, data] of Object.entries(servers)) {
        if (!data.skipped && !data.m3u8) servers[name].embed_only = true;
      }
    }

    return json({
      success: true,
      data: servers,
      episode_url: finalUrl,
      embed_iframe_url: embedUrl,
      has_m3u8,
    });

  } catch (error) {
    return json({
      success: false,
      error: error.message,
      episode_id: episodeId,
      hint: "The episode page may not exist on dramacool.sh. Check that the episode_id is correct.",
    }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
