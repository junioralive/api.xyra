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

// Function to extract manga data from a list item
function extractMangaItem($, element, baseUrl) {
  const $li = $(element);
  const title = $li.find(".manga-list-1-item-title a").text().trim();
  const link = $li.find("a").first().attr("href");
  const id = link ? link.split("/manga/")[1]?.split("/")[0] : null;
  const imageUrl = $li.find(".manga-list-1-cover").attr("src");
  const image = getProxyImageUrl(imageUrl, baseUrl);
  const chapter = $li.find(".manga-list-1-item-subtitle a").text().trim();
  const stars = $li.find(".item-star");
  const rating = convertStarsToRating(stars, $);
  const score = $li.find(".item-score").text().trim();

  return {
    title,
    id,
    link,
    image,
    image_original: imageUrl,
    chapter,
    rating,
    score: parseFloat(score) || 0,
  };
}

// Function to extract recommended manga with detailed info
function extractRecommendedManga($, element, baseUrl) {
  const $item = $(element);
  const title = $item.find(".manga-list-1-item-title a").text().trim();
  const link = $item.find("a").first().attr("href");
  const id = link ? link.split("/manga/")[1]?.split("/")[0] : null;
  const imageUrl = $item.find(".manga-list-1-cover").attr("src");
  const image = getProxyImageUrl(imageUrl, baseUrl);
  const chapter = $item.find(".manga-list-1-item-subtitle a").text().trim();
  const stars = $item.find(".item-star");
  const rating = convertStarsToRating(stars, $);
  const score = $item.find(".item-score").text().trim();

  // Extract hover info (detailed information)
  const $hover = $item.find(".manga-list-hover-info-new");
  const genres = [];
  const views = $hover.find(".manga-list-hover-info-line:contains('Views') .manga-list-hover-info-content").text().trim();
  const rank = $hover.find(".manga-list-hover-info-line:contains('Rank') .manga-list-hover-info-content").text().trim();
  const author = $hover.find(".manga-list-hover-info-blue").text().trim();
  const summary = $hover.find(".manga-list-hover-info-line:contains('Summary') .manga-list-hover-info-content").text().trim();

  $hover.find(".manga-list-hover-info-tag .item-tag").each((_, tag) => {
    genres.push($(tag).text().trim());
  });

  return {
    title,
    id,
    link,
    image,
    image_original: imageUrl,
    chapter,
    rating,
    score: parseFloat(score) || 0,
    views,
    genres,
    author,
    rank,
    summary,
  };
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

    // Fetch the HTML content of the website
    const response = await axios.get("https://fanfox.net/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://fanfox.net/",
      },
      timeout: 10000,
    });
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Initialize data containers
    const hotMangaReleases = [];
    const beingReadRightNow = [];
    const popularMangaRanking = [];
    const recommendedManga = [];
    const newMangaRelease = [];
    const latestUpdates = [];
    const trendingManga = [];

    // Extract "Hot Manga Releases"
    $(".manga-list-1-title:contains('Hot Manga Releases')")
      .closest(".manga-list-1")
      .find("ul li")
      .each((_, element) => {
        const mangaData = extractMangaItem($, element, baseUrl);
        if (mangaData.title) hotMangaReleases.push(mangaData);
      });

    // Extract "Being Read Right Now"
    $(".manga-list-1-title:not(:contains('Hot'))")
      .closest(".manga-list-1")
      .find("ul li")
      .each((_, element) => {
        const mangaData = extractMangaItem($, element, baseUrl);
        if (mangaData.title) beingReadRightNow.push(mangaData);
      });

    // Extract "Popular Manga Ranking"
    $(".manga-list-2-title:contains('Popular')")
      .closest(".manga-list-2")
      .find("ul li")
      .each((_, element) => {
        const $li = $(element);
        const rank = $li.find(".manga-list-2-logo, [class*='manga-list-2-logo']").text().trim();
        const title = $li.find(".manga-list-2-item-title a").text().trim();
        const link = $li.find(".manga-list-2-item-title a").attr("href");
        const id = link ? link.split("/manga/")[1]?.split("/")[0] : null;
        const chapter = $li.find(".manga-list-2-item-subtitle a").text().trim();

        if (title) {
          popularMangaRanking.push({
            rank: parseInt(rank) || 0,
            title,
            id,
            link,
            chapter,
          });
        }
      });

    // Extract "Recommended" section with detailed info
    $(".manga-list-3 .manga-list-1-list li").each((_, element) => {
      const mangaData = extractRecommendedManga($, element, baseUrl);
      if (mangaData.title) recommendedManga.push(mangaData);
    });

    // Extract featured recommended manga info
    const $recommendedShow = $(".manga-list-3-show");
    const featuredRecommendedImageUrl = $recommendedShow.find(".manga-list-3-show-img").attr("src");
    const featuredRecommended = {
      title: $recommendedShow.find(".manga-list-3-show-title a").text().trim(),
      link: $recommendedShow.find(".manga-list-3-show-title a").attr("href"),
      id: $recommendedShow.find(".manga-list-3-show-title a").attr("href")?.split("/manga/")[1]?.split("/")[0],
      image: getProxyImageUrl(featuredRecommendedImageUrl, baseUrl),
      image_original: featuredRecommendedImageUrl,
      genres: [],
      authors: [],
      description: "",
      rating: 0,
      views: "",
      rank: "",
    };

    $recommendedShow.find(".manga-list-3-show-tag-list span").each((_, element) => {
      featuredRecommended.genres.push($(element).text().trim());
    });

    $recommendedShow.find(".manga-list-3-show-say:contains('Author')").each((_, element) => {
      const $el = $(element);
      $el.find("a").each((_, link) => {
        featuredRecommended.authors.push($(link).text().trim());
      });
    });

    featuredRecommended.description = $recommendedShow
      .find(".manga-list-3-show-content")
      .text()
      .trim();

    // Extract views and rank from hover info if available
    const $hoverInfo = $recommendedShow.closest(".manga-list-3").find(".manga-list-hover-info-new");
    if ($hoverInfo.length) {
      featuredRecommended.views = $hoverInfo
        .find(".manga-list-hover-info-line:contains('Views') .manga-list-hover-info-content")
        .text()
        .trim();
      featuredRecommended.rank = $hoverInfo
        .find(".manga-list-hover-info-line:contains('Rank') .manga-list-hover-info-content")
        .text()
        .trim();
    }

    // Extract "New Manga Release"
    $(".manga-list-1-title:contains('New Manga Release')")
      .closest(".manga-list-1")
      .find("ul li")
      .each((_, element) => {
        const mangaData = extractMangaItem($, element, baseUrl);
        if (mangaData.title) newMangaRelease.push(mangaData);
      });

    // Extract "Latest Updates"
    $(".manga-list-4-title:contains('Lastest Updates')")
      .closest(".manga-list-4")
      .find("ul > li")
      .each((_, element) => {
        const $li = $(element);
        const title = $li.find(".manga-list-4-item-title a").text().trim();
        const link = $li.find(".manga-list-4-item-title a").attr("href");
        const id = link ? link.split("/manga/")[1]?.split("/")[0] : null;
        const imageUrl = $li.find(".manga-list-4-cover").attr("src");
        const image = getProxyImageUrl(imageUrl, baseUrl);
        const subtitle = $li.find(".manga-list-4-item-subtitle").text().trim();
        const timeAgo = $li.find(".manga-list-4-item-subtitle span").text().trim();
        const chapters = [];
        const genres = [];

        // Extract chapters
        $li.find(".manga-list-4-item-part li:not(.more) a").each((_, ch) => {
          chapters.push({
            name: $(ch).text().trim(),
            link: $(ch).attr("href"),
          });
        });

        // Extract genres
        $li.find(".manga-list-4-show-tag-list a").each((_, genre) => {
          genres.push($(genre).text().trim());
        });

        if (title) {
          latestUpdates.push({
            title,
            id,
            link,
            image,
            image_original: imageUrl,
            subtitle,
            timeAgo,
            chapters,
            genres,
          });
        }
      });

    // Extract "Trending Manga"
    $(".manga-list-2-title:contains('Trending')")
      .closest(".manga-list-2")
      .find("ul li")
      .each((_, element) => {
        const $li = $(element);
        const rank = $li.find(".manga-list-2-logo, [class*='manga-list-2-logo']").text().trim();
        const title = $li.find(".manga-list-2-item-title a").text().trim();
        const link = $li.find(".manga-list-2-item-title a").attr("href");
        const id = link ? link.split("/manga/")[1]?.split("/")[0] : null;
        const chapter = $li.find(".manga-list-2-item-subtitle a").text().trim();

        if (title) {
          trendingManga.push({
            rank: parseInt(rank) || 0,
            title,
            id,
            link,
            chapter,
          });
        }
      });

    // Return the data in the desired JSON structure
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          hot_manga_releases: hotMangaReleases,
          being_read_right_now: beingReadRightNow,
          popular_manga_ranking: popularMangaRanking,
          featured_recommended: featuredRecommended,
          recommended_manga: recommendedManga,
          new_manga_release: newMangaRelease,
          latest_updates: latestUpdates,
          trending_manga: trendingManga,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching or parsing the website:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch data.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
