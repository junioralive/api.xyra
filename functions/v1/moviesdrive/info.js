import axios from "axios";

const BASE = "https://new3.moviesdrives.my";

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
};

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

    const pageUrl = id.startsWith("http") ? id : `${BASE}/${id}/`;
    const { data: html } = await axios.get(pageUrl, { headers: { ...HEADERS } });

    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/&#8211;/g, "-").trim() : null;

    // Image: try tmdb posters first, then wp-content uploads
    const imgMatch = html.match(/src="(https:\/\/image\.tmdb\.org\/[^"]+)"/i)
      || html.match(/src="(\/wp-content\/uploads\/[^"]+\.(?:jpg|png|webp))"/i);
    const image = imgMatch ? imgMatch[1].startsWith("/") ? "https://new3.moviesdrives.my" + imgMatch[1] : imgMatch[1] : null;

    // Description: p tag with IMDb Rating or Series Name
    let description = null;
    const pMatches = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    for (const p of pMatches) {
      const text = p.replace(/<[^>]+>/g, "").replace(/&#8211;/g, "-").replace(/&#8217;/g, "'").trim();
      if ((text.includes("IMDb Rating") || text.includes("Series Name") || text.includes("Movie Name")) && text.length > 60) {
        description = text;
        break;
      }
    }
    if (!description) {
      const m = html.match(/<p[^>]*>([^<]{80,500})<\/p>/i);
      description = m ? m[1].replace(/&#8211;/g, "-").trim() : null;
    }

    const cats = [];
    const catMatches = html.match(/rel="category tag"[^>]*>([^<]+)</gi);
    if (catMatches) {
      catMatches.forEach(c => {
        const name = c.replace(/rel="category tag"[^>]*>/i, "").trim();
        if (name && name !== "/") cats.push(name);
      });
    }

    const imdbMatch = html.match(/imdb\.com\/title\/tt(\d+)/i);
    const imdbId = imdbMatch ? `tt${imdbMatch[1]}` : null;

    // Downloads: mdrive.lol links with nearby quality labels
    const downloads = [];
    const mdriveLinks = html.match(/https:\/\/mdrive\.lol\/archive\/\d+\/?/gi) || [];
    const seenUrls = new Set();
    for (const url of mdriveLinks) {
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      const pos = html.indexOf(url);
      const context = html.substring(Math.max(0, pos - 400), pos);
      const quals = context.match(/(480p|720p|1080p|2160p|4K|WEB-DL|HDRip|BluRay|x26[45]|HEVC|10bit)/gi) || [];
      downloads.push({
        quality: [...new Set(quals)].join(" "),
        url,
      });
    }

    // Related
    const related = [];
    const relatedRegex = /<a[^>]*href="(https:\/\/new3\.moviesdrives\.my\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let relMatch;
    while ((relMatch = relatedRegex.exec(html)) !== null) {
      if (related.length >= 6) break;
      const rLink = relMatch[1];
      const rBlock = relMatch[2];
      if (!rBlock.includes("poster-card") || rLink === pageUrl) continue;

      const rTitleMatch = rBlock.match(/poster-title[^>]*>([\s\S]*?)<\/p>/i);
      const rTitle = rTitleMatch ? rTitleMatch[1].replace(/&#8211;/g, "-").trim() : null;
      const rImgMatch = rBlock.match(/<img[^>]*src="([^"]+)"/i);

      if (rTitle) {
        related.push({ title: rTitle, id: rLink.replace(BASE + "/", "").replace(/\/$/, ""), link: rLink, image: rImgMatch ? rImgMatch[1] : null });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: id.startsWith("http") ? id.replace(BASE + "/", "").replace(/\/$/, "") : id,
        title,
        image,
        description,
        categories: cats,
        imdb_id: imdbId,
        type: /season|series|episode/i.test(title || "") ? "series" : "movie",
        downloads,
        download_count: downloads.length,
        related,
      },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
