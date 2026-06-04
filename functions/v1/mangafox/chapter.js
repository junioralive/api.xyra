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

function unpackEval(jsCode) {
  // Unpack eval(function(p,a,c,k,e,d){...}('body',base,count,'keys'.split('|'),0,{}))
  const match = jsCode.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?return p;\}\('(.+?)',(\d+),(\d+),'(.+?)'\.split\('\|'\)/);
  if (!match) return null;

  const [, packed, baseStr, countStr, keysStr] = match;
  const base = parseInt(baseStr);
  const count = parseInt(countStr);
  const keys = keysStr.split('|');

  // Build e(c) token → key mapping
  // e(c) returns c in base-36, but the c values in packed are already the tokens
  // Actually the packed code uses base-36 token strings like 'k','o','s','p' etc.
  // The unpacker in the JS: e(c) = (c<a) ? c.toString(36) : e(parseInt(c/a)) + (c%a).toString(36)
  // We need to compute e(i) for each i from 0 to count-1
  function e(c, a) {
    if (c < a) return c.toString(36);
    return e(Math.floor(c / a), a) + (c % a).toString(36);
  }

  const dict = {};
  for (let i = 0; i < count; i++) {
    const token = e(i, base);
    if (i < keys.length && keys[i]) {
      dict[token] = keys[i];
    }
  }

  let result = packed;
  const tokens = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const token of tokens) {
    const regex = new RegExp("\\b" + token + "\\b", "g");
    result = result.replace(regex, dict[token]);
  }

  return result;
}

function deobfuscateChapterfun(jsCode) {
  const unpacked = unpackEval(jsCode);
  if (!unpacked) return null;

  // Unpacked is like: function e(){var f="//cdn.../pix.jpg";var pvalue=["/suffix1.jpg?...","/suffix2.jpg?..."];...var d;d=e();
  const cdnMatch = unpacked.match(/var\s+\w+\s*=\s*"(\/\/[^"]+)"/);
  const suffixMatch = unpacked.match(/pvalue\s*=\s*(\[[^\]]*\])/);

  if (!cdnMatch || !suffixMatch) return null;

  const cdnBase = cdnMatch[1];
  let suffixes;
  try {
    suffixes = JSON.parse(suffixMatch[1].replace(/'/g, '"'));
  } catch {
    return null;
  }

  return suffixes.map(s => {
    return "https:" + cdnBase + s;
  });
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const baseUrl = new URL(request.url).origin;
    let apiKey, mangaId, chapter;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      mangaId = body.id;
      chapter = body.chapter;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      mangaId = url.searchParams.get("id");
      chapter = url.searchParams.get("chapter");
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (!mangaId || !chapter) {
      return new Response(JSON.stringify({ success: false, message: "Missing id or chapter parameter." }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const pageUrl = `${BASE}/manga/${mangaId}/${chapter}/1.html`;
    const { data: html } = await axios.get(pageUrl, { headers: HEADERS });
    const $ = cheerio.load(html);

    const comicIdMatch = html.match(/var\s+comicid\s*=\s*(\d+)/);
    const chapterIdMatch = html.match(/var\s+chapterid\s*=\s*(\d+)/);
    const imageCountMatch = html.match(/var\s+imagecount\s*=\s*(\d+)/);

    const comicId = comicIdMatch ? parseInt(comicIdMatch[1]) : null;
    const chapterId = chapterIdMatch ? parseInt(chapterIdMatch[1]) : null;
    const imageCount = imageCountMatch ? parseInt(imageCountMatch[1]) : 0;

    const title = $(".reader-header-title-1 a").first().text().trim();
    const chapterTitle = $(".reader-header-title-2").text().trim();

    const chapterList = [];
    $(".reader-header-title-list a").each((_, el) => {
      chapterList.push({ name: $(el).text().trim(), link: $(el).attr("href") });
    });

    const pages = [];
    $(".pager-list-left span a").each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && text !== ">" && !text.includes("...")) {
        pages.push({ page: parseInt(text) || 0, url: href });
      }
    });

    const prevChapter = $(".reader-main-pager a").first().attr("href") || null;
    const nextChapter = $(".reader-main-next").attr("href") || null;

    // Fetch images via chapterfun.ashx (2 images per page)
    let rawImages = [];
    if (comicId && chapterId && imageCount > 0) {
      const pagesNeeded = Math.ceil(imageCount / 2);
      for (let page = 1; page <= pagesNeeded; page++) {
        try {
          const resp = await axios.get(`${BASE}/manga/chapterfun.ashx`, {
            params: { cid: chapterId, page, key: "" },
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": pageUrl,
            },
            timeout: 10000,
          });
          const pageImages = deobfuscateChapterfun(resp.data);
          if (pageImages && pageImages.length) {
            rawImages.push(...pageImages);
          }
        } catch (e) {
          console.error(`chapterfun page ${page} error:`, e.message);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: title || null,
        chapter: chapterTitle || chapter,
        manga_id: mangaId,
        comic_id: comicId,
        chapter_id: chapterId,
        image_count: imageCount || rawImages.length,
        images: rawImages.map(url => getProxyImageUrl(url, baseUrl)),
        images_original: rawImages,
        pages: pages.length ? pages : Array.from({ length: imageCount || rawImages.length }, (_, i) => ({ page: i + 1, url: `/manga/${mangaId}/${chapter}/${i + 1}.html` })),
        chapters: chapterList,
        navigation: { prev: prevChapter, next: nextChapter },
      },
      episode_url: pageUrl,
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
