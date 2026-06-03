import * as cheerio from "cheerio";
import axios from "axios";

function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",").map((key) => key.trim());
  return validApiKeys.includes(apiKey);
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
    let mangaId = null;

    const url = new URL(request.url);

    if (request.method === "POST") {
      const contentType = request.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        apiKey = body.api_key;
        mangaId = body.id;
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
      mangaId = url.searchParams.get("id");
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Method not allowed. Use GET or POST.",
        }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!mangaId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing manga ID.",
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

    const infoUrl = `https://www.manganato.gg/manga/${mangaId}`;
    const response = await axios.get(infoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $(".manga-info-content h1").text().trim();
    const imageUrl = $(".manga-info-pic img").attr("src");
    
    let author = "Unknown";
    let status = "Unknown";
    let lastUpdated = "Unknown";
    let views = "0";
    let rating = "0.00";

    $(".manga-info-text li").each((_, li) => {
      const text = $(li).text().trim();
      if (text.startsWith("Author(s)")) {
        author = text.replace("Author(s) :", "").trim();
      } else if (text.startsWith("Status :")) {
        status = text.replace("Status :", "").trim();
      } else if (text.startsWith("Last updated :")) {
        lastUpdated = text.replace("Last updated :", "").trim();
      } else if (text.startsWith("View :")) {
        views = text.replace("View :", "").trim();
      }
    });

    const ratingText = $("#rate_row_cmd").text().trim();
    const ratingMatch = ratingText.match(/rate\s*:\s*([\d.]+)/i);
    if (ratingMatch) {
      rating = ratingMatch[1];
    }

    const genres = [];
    $(".genres a").each((_, a) => {
      genres.push($(a).text().trim());
    });

    let description = "";
    $("#contentBox").each((_, el) => {
      const text = $(el).text();
      const summaryMatch = text.match(/summary:\s*([\s\S]*)/i);
      if (summaryMatch) {
        description = summaryMatch[1].trim();
      } else {
        description = text.trim();
      }
    });

    let chapters = [];
    try {
      const chaptersResponse = await axios.get(`https://www.manganato.gg/api/manga/${mangaId}/chapters`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      });

      if (chaptersResponse.data && chaptersResponse.data.success && chaptersResponse.data.data) {
        chapters = chaptersResponse.data.data.chapters.map((ch) => ({
          name: ch.chapter_name,
          chapter_num: ch.chapter_num,
          link: `https://www.manganato.gg/manga/${mangaId}/${ch.chapter_slug}`,
          id: ch.chapter_slug,
          updated_at: ch.updated_at,
          view: ch.view,
        }));
      }
    } catch (chapterError) {
      console.error("Error fetching chapters for", mangaId, chapterError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: mangaId,
          title,
          image: getProxyImageUrl(imageUrl, baseUrl),
          image_original: imageUrl,
          author,
          status,
          last_updated: lastUpdated,
          views,
          rating,
          genres,
          description,
          chapters,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching manganato info:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch manganato info data.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
