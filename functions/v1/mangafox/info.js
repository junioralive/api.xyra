import * as cheerio from "cheerio";
import axios from "axios";

// Function to validate API key
function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",").map(key => key.trim());
  return validApiKeys.includes(apiKey);
}

// Function to convert star images to rating
function convertStarsToRating(starElements, $) {
  let rating = 0;
  starElements.each((_, element) => {
    const src = $(element).attr("src");
    if (src.includes("star-10")) rating += 1;
    else if (src.includes("star-0")) rating += 0;
  });
  return rating;
}

// Function to wrap image URL through proxy
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

    // Get API key
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

    // Validate API key
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

    // Validate manga ID
    if (!mangaId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing 'id' parameter. Please provide a manga ID.",
          example: "?api_key=YOUR_KEY&id=vigilante_boku_no_hero_academia_illegals",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the manga detail page
    const response = await axios.get(`https://fanfox.net/manga/${mangaId}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://fanfox.net/",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract basic info
    const title = $(".detail-info-right-title-font").text().trim();
    const coverImageUrl = $(".detail-info-cover-img").attr("src");
    const coverImage = getProxyImageUrl(coverImageUrl, baseUrl);
    const status = $(".detail-info-right-title-tip").text().trim();
    const description = $(".detail-info-right-content").text().trim();

    // Extract rating
    const ratingStars = $(".detail-info-right-title-star .item-star");
    const score = $(".detail-info-right-title-star .item-score").text().trim();
    const rating = convertStarsToRating(ratingStars, $);

    // Extract authors
    const authors = [];
    $(".detail-info-right-say a").each((_, element) => {
      authors.push($(element).text().trim());
    });

    // Extract genres
    const genres = [];
    $(".detail-info-right-tag-list a").each((_, element) => {
      genres.push({
        name: $(element).text().trim(),
        link: $(element).attr("href"),
      });
    });

    // Extract chapters - includes hidden chapters with display:none
    const chapters = [];
    $(".detail-main-list li").each((_, element) => {
      const $li = $(element);
      const chapterLink = $li.find("a").attr("href");
      const chapterNumber = $li.find(".title3").text().trim();
      const chapterDate = $li.find(".title2").text().trim();

      // Include all chapters regardless of display:none style
      if (chapterNumber && chapterLink) {
        chapters.push({
          name: chapterNumber,
          link: chapterLink,
          date: chapterDate,
        });
      }
    });

    // Extract chapter count from title (e.g., "CHAPTER（135）")
    const chapterCountMatch = $(".detail-main-list-title").text().match(/（(\d+)）/);
    const chapterCount = chapterCountMatch ? parseInt(chapterCountMatch[1]) : chapters.length;

    // Extract latest chapter link
    const latestChapterLink = $(".detail-info-right-read").attr("href");
    const latestChapter = $(".detail-info-right-read").text().trim();

    // Extract author's other manga
    const authorOtherManga = [];
    $(".detail-main-small .manga-list-2-list:first li").each((_, element) => {
      const $li = $(element);
      const title = $li.find(".manga-list-2-item-title a").text().trim();
      const link = $li.find(".manga-list-2-item-title a").attr("href");
      const id = link ? link.split("/manga/")[1]?.split("/")[0] : null;
      const chapter = $li.find(".manga-list-2-item-subtitle a").text().trim();

      if (title) {
        authorOtherManga.push({
          title,
          id,
          link,
          chapter,
        });
      }
    });

    // Extract background image
    const backgroundImageUrl = $(".detail-bg-img").attr("src");
    const backgroundImage = getProxyImageUrl(backgroundImageUrl, baseUrl);

    // Return the structured data
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: mangaId,
          title,
          status,
          description,
          rating: parseFloat(rating) || 0,
          score: parseFloat(score) || 0,
          cover_image: coverImage,
          cover_image_original: coverImageUrl,
          background_image: backgroundImage,
          background_image_original: backgroundImageUrl,
          authors,
          genres,
          chapter_count: chapterCount,
          latest_chapter: latestChapter,
          latest_chapter_link: latestChapterLink,
          chapters: chapters, // Return all chapters including hidden ones
          total_chapters_returned: chapters.length,
          author_other_manga: authorOtherManga,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching manga info:", error);

    // Check if it's a 404
    if (error.response?.status === 404) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Manga not found",
          message: `The manga with the provided ID was not found on fanfox.net`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch manga info.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
