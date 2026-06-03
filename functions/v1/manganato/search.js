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
    let query = "";
    let page = 1;

    const url = new URL(request.url);

    if (request.method === "POST") {
      const contentType = request.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        apiKey = body.api_key;
        query = body.query || "";
        page = body.page || 1;
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
      query = url.searchParams.get("query") || "";
      page = parseInt(url.searchParams.get("page") || 1, 10);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Method not allowed. Use GET or POST.",
        }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!query) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required parameter: query",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Search URL format: https://www.manganato.gg/search/story/{query}?page={page}
    const encodedQuery = encodeURIComponent(query.toLowerCase().replace(/\s+/g, "_"));
    const searchUrl = `https://www.manganato.gg/search/story/${encodedQuery}?page=${page}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const mangaList = [];
    $(".list-story-item").each((_, element) => {
      const $item = $(element);
      const link = $item.attr("href");
      const id = getMangaId(link);
      const title = $item.attr("title");
      const imageUrl = $item.find("img").attr("src");
      
      // Find the parent container to get chapter info
      const $parent = $item.closest(".list-comic-item-wrap");
      const chapterLink = $parent.find(".list-story-item-wrap-chapter").attr("href");
      const chapter = $parent.find(".list-story-item-wrap-chapter").text().trim();

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
          query,
          page,
          total_pages: totalPages,
          results: mangaList,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching manganato search:", error);

    // Check if it's a Cloudflare challenge (403)
    if (error.response?.status === 403 && error.response?.data?.includes("Just a moment...")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Cloudflare protection blocked the search request.",
          details: "The search endpoint is currently protected by Cloudflare. Please try again later or use the list endpoint with specific genres.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch manganato search data.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
