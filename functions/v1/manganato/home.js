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

    if (request.method === "POST") {
      const contentType = request.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        apiKey = body.api_key;
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
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
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

    const response = await axios.get("https://www.manganato.gg/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const popularManga = [];
    $("#owl-demo .item").each((_, element) => {
      const $item = $(element);
      const title = $item.find(".slide-caption h3 a").text().trim();
      const link = $item.find(".slide-caption h3 a").attr("href");
      const id = getMangaId(link);
      const imageUrl = $item.find("img").attr("src");
      
      let chapter = null;
      let chapterLink = null;
      $item.find(".slide-caption a").each((_, a) => {
        const text = $(a).text().trim();
        if (text.toLowerCase().includes("chapter")) {
          chapter = text;
          chapterLink = $(a).attr("href");
        }
      });

      if (id && title) {
        popularManga.push({
          id,
          title,
          link: link || `/manga/${id}`,
          image: getProxyImageUrl(imageUrl, baseUrl),
          image_original: imageUrl,
          chapter,
          chapter_link: chapterLink,
        });
      }
    });

    const latestUpdates = [];
    $(".itemupdate.first").each((_, element) => {
      const $item = $(element);
      const title = $item.find("h3 a").text().trim();
      const link = $item.find("h3 a").attr("href");
      const id = getMangaId(link);
      const imageUrl = $item.find("a.cover img").attr("src");
      const chapter = $item.find(".sts a").text().trim();
      const chapterLink = $item.find(".sts a").attr("href");
      const timeAgo = $item.find("i").text().trim();

      if (id && title) {
        latestUpdates.push({
          id,
          title,
          link: link || `/manga/${id}`,
          image: getProxyImageUrl(imageUrl, baseUrl),
          image_original: imageUrl,
          chapter,
          chapter_link: chapterLink,
          time_ago: timeAgo,
        });
      }
    });

    const mostPopular = [];
    $(".xem-nhieu-item").each((_, element) => {
      const $item = $(element);
      const link = $item.find("h3 a").attr("href");
      const id = getMangaId(link);
      const text = $item.find("h3 a").text().trim();
      
      // Text is usually "Title - Chapter X"
      const parts = text.split(" - ");
      const title = parts[0].trim();
      const chapter = parts[1] ? parts[1].trim() : null;

      if (id && title) {
        mostPopular.push({
          id,
          title,
          link: link || `/manga/${id}`,
          chapter,
        });
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          popular_manga: popularManga,
          latest_updates: latestUpdates,
          most_popular: mostPopular,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching manganato home:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch manganato home data.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
