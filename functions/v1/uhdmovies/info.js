import axios from "axios";

const BASE = "https://uhdmovies.rodeo";

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

    // Title
    const titleMatch = html.match(/<h1[^>]*class="entry-title"[^>]*>([\s\S]*?)<\/h1>/i)
      || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : null;

    // OG Image
    const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    const image = ogMatch ? ogMatch[1] : null;

    // Description from first meaningful <p>
    const descMatch = html.match(/<p[^>]*>([^<]{50,300})<\/p>/i);
    const description = descMatch ? descMatch[1].trim() : null;

    // Categories from article class
    const articleMatch = html.match(/<article([^>]*)>/i);
    const cats = [];
    if (articleMatch) {
      const catMatches = articleMatch[1].match(/category-([a-z0-9-]+)/gi);
      if (catMatches) {
        catMatches.forEach(c => {
          const name = c.replace("category-", "").replace(/-/g, " ");
          if (!cats.includes(name)) cats.push(name);
        });
      }
    }

    // Quality downloads: <strong>QUALITY</strong> followed by <a href="LINK">
    const downloads = [];
    const strongLinkRegex = /<strong>([\s\S]*?)<\/strong>[\s\S]*?<a[^>]*href="(https:\/\/cloud\.unblockedgames\.world\/[^"]+)"/gi;
    let dlMatch;
    while ((dlMatch = strongLinkRegex.exec(html)) !== null) {
      const quality = dlMatch[1].replace(/<[^>]+>/g, "").trim();
      const url = dlMatch[2];
      if (!downloads.some(d => d.url === url) && quality.length > 2) {
        downloads.push({ quality, url });
      }
    }

    // Also try: <a href="CLOUD_URL">
    const cloudLinks = html.match(/https:\/\/cloud\.unblockedgames\.world\/\?sid=[a-zA-Z0-9+/=]+/gi);
    if (cloudLinks) {
      const existingUrls = new Set(downloads.map(d => d.url));
      for (const url of cloudLinks) {
        if (!existingUrls.has(url) && downloads.length < 15) {
          downloads.push({ quality: "Download", url });
          existingUrls.add(url);
        }
      }
    }

    // Related posts
    const related = [];
    const relatedRegex = /<article([^>]*)>([\s\S]*?)<\/article>/gi;
    let relMatch;
    while ((relMatch = relatedRegex.exec(html)) !== null) {
      if (related.length >= 6) break;
      const tagAttrs = relMatch[1];
      const block = relMatch[2];

      const allLinks = block.match(/href="(https:\/\/uhdmovies\.rodeo\/[^"]+?)"/gi);
      let link = null;
      if (allLinks) {
        for (const l of allLinks) {
          const href = l.replace(/href="|"/g, "");
          if (!href.includes("feed") && !href.includes("#respond") && href !== pageUrl) {
            link = href;
            break;
          }
        }
      }
      if (!link) continue;

      const rTitleMatch = block.match(/class="sanket"[^>]*>([^<]+)<\/h1>/i) || block.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      const rTitle = rTitleMatch ? rTitleMatch[1].replace(/^Download\s+/i, "").trim() : null;
      const rImgMatch = block.match(/<img[^>]*src="(https:\/\/[^"]+(?:jpg|png|webp))"/i);

      if (rTitle && link) {
        related.push({
          title: rTitle,
          id: link.replace(BASE + "/", "").replace(/\/$/, ""),
          link,
          image: rImgMatch ? rImgMatch[1] : null,
        });
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
