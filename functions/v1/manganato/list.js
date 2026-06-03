import * as cheerio from "cheerio";
import axios from "axios";

function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",").map((key) => key.trim());
  return validApiKeys.includes(apiKey);
}

function getMangaId(href) {
  if (!href) return null;
  const match = href.match(/\/manga\/([^/]+)/);
  return match ? match[1] : null;
}

function getProxyImageUrl(imageUrl, baseUrl) {
  if (!imageUrl) return imageUrl;
  try {
    const proxyUrl = new URL("/v1/image", baseUrl);
    proxyUrl.searchParams.append("url", imageUrl);
    proxyUrl.searchParams.append("referer", "https://www.manganato.gg/");
    return proxyUrl.toString();
  } catch {
    return imageUrl;
  }
}

export async function onRequest({ request, env }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const baseUrl = new URL(request.url).origin;
    let apiKey = null;
    let type = "latest"; // latest, hot, new, completed
    let genre = "all";
    let state = "all"; // all, ongoing, completed
    let page = 1;

    const url = new URL(request.url);

    if (request.method === "POST") {
      const contentType = request.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        apiKey = body.api_key;
        type = body.type || type;
        genre = body.genre || genre;
        state = body.state || state;
        page = body.page || page;
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Unsupported Content-Type. Please use application/json.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (request.method === "GET") {
      apiKey = url.searchParams.get("api_key");
      type = url.searchParams.get("type") || type;
      genre = url.searchParams.get("genre") || genre;
      state = url.searchParams.get("state") || state;
      page = parseInt(url.searchParams.get("page") || page, 10);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Method not allowed. Use GET or POST.",
        }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid or missing API key.",
          protip: "Missing API key? Join our Discord and claim yours—it's free! 👉 https://discord.gg/cwDTVKyKJz",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct the URL based on parameters
    // Examples:
    // https://www.manganato.gg/genre/all?type=latest&state=all&page=1
    // https://www.manganato.gg/genre/action?type=latest&state=ongoing&page=2
    // https://www.manganato.gg/manga-list/latest-manga?page=1 (handled by genre=all, type=latest)
    
    let listUrl = `https://www.manganato.gg/genre/${genre}?type=${type}&state=${state}&page=${page}`;
    
    // Special case for manga-list routes if needed, but /genre/all covers them based on the site's own links
    if (genre === "all" && type === "latest" && state === "all") {
      listUrl = `https://www.manganato.gg/manga-list/latest-manga?page=${page}`;
    } else if (genre === "all" && type === "hot" && state === "all") {
      listUrl = `https://www.manganato.gg/manga-list/hot-manga?page=${page}`;
    } else if (genre === "all" && type === "new" && state === "all") {
      listUrl = `https://www.manganato.gg/manga-list/new-manga?page=${page}`;
    } else if (genre === "all" && type === "latest" && state === "completed") {
      listUrl = `https://www.manganato.gg/manga-list/completed-manga?page=${page}`;
    }

    const response = await axios.get(listUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const mangaList = [];
    $(".list-comic-item-wrap").each((_, element) => {
      const $item = $(element);
      const link = $item.find(".list-story-item").attr("href");
      const id = getMangaId(link);
      const title = $item.find("h3 a").text().trim();
      const imageUrl = $item.find(".list-story-item img").attr("src");
      const chapterLink = $item.find(".list-story-item-wrap-chapter").attr("href");
      const chapter = $item.find(".list-story-item-wrap-chapter").text().trim();

      if (id && title) {
        mangaList.push({
          id,
          title,
          link: link || `/manga/${id}`,
          image: getProxyImageUrl(imageUrl, baseUrl),
          image_original: imageUrl,
          chapter: chapter || null,
          chapter_link: chapterLink || null,
        });
      }
    });

    // Extract pagination info
    let totalPages = 1;
    const lastPageLink = $(".group_page a.page_last").attr("href");
    if (lastPageLink) {
      const match = lastPageLink.match(/page=(\d+)/);
      if (match) {
        totalPages = parseInt(match[1], 10);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          page,
          total_pages: totalPages,
          results: mangaList,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching manganato list:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch manganato list data.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
