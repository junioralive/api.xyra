import * as cheerio from "cheerio";
import axios from "axios";

// Function to validate API key
function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",").map(key => key.trim());
  return validApiKeys.includes(apiKey);
}



// Function to extract manga ID from href
function getMangaId(href) {
  if (!href) return null;
  // Extract ID from links like "/komi-cant-communicate-287"
  const match = href.match(/^\/([a-z0-9\-]+)(?:-\d+)?$/);
  return match ? match[1] : href.split('/').filter(Boolean)[0];
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

    const url = new URL(request.url);

    // Get API key
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

    // Fetch the mangareader home page
    const response = await axios.get("https://mangareader.to/home", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://mangareader.to/",
        "Origin": "https://mangareader.to",
        "Sec-Ch-Ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // ===== HOT UPDATES SECTION (Original) =====
    const hotUpdates = [];
    $("#slider .swiper-wrapper .swiper-slide").each((_, element) => {
      const $slide = $(element);
      
      // Skip duplicate slides
      if ($slide.hasClass("swiper-slide-duplicate")) return;

      const $item = $slide.find(".deslide-item");
      if (!$item.length) return;

      // Extract basic info
      const link = $item.find(".deslide-cover").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".desi-head-title a").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      
      // Extract chapter info
      const chapterText = $item.find(".desi-sub-text").text().trim();
      const chapterMatch = chapterText.match(/Chapter:\s*([^\n\[]+)/);
      const chapter = chapterMatch ? chapterMatch[1].trim() : null;
      
      const languageMatch = chapterText.match(/\[([^\]]+)\]/);
      const language = languageMatch ? languageMatch[1] : "EN";

      // Extract description
      const description = $item.find(".scd-item.mb-3").text().trim();

      // Extract genres
      const genres = [];
      $item.find(".scd-genres span").each((_, genreElement) => {
        const genreText = $(genreElement).text().trim();
        if (genreText) genres.push(genreText);
      });

      // Extract action buttons
      const readLink = $item.find(".btn-slide-read").attr("href");
      const infoLink = $item.find(".btn-slide-info").attr("href");

      if (id && title) {
        hotUpdates.push({
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          chapter,
          language,
          description,
          genres,
          read_link: readLink,
          info_link: infoLink,
        });
      }
    });

    // ===== TRENDING SECTION (Original) =====
    const trending = [];
    $("#trending-home .swiper-wrapper .swiper-slide").each((_, element) => {
      const $slide = $(element);
      const $item = $slide.find(".item");
      if (!$item.length) return;

      const link = $item.find(".link-mask").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".alias-name strong").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      const rating = $item.find(".mp-desc p:eq(1)").text().replace(/[^\d.]/g, "");
      
      // Extract languages
      const languagesText = $item.find(".mp-desc p:eq(2)").text().trim();
      const languages = languagesText.replace(/^.*?\/\//g, "").trim();

      // Extract chapter and volume links
      const chapterLink = $item.find(".mp-desc p:eq(3) a").attr("href");
      const chapterText = $item.find(".mp-desc p:eq(3) strong").text().trim().replace(/\s+/g, " ");
      const volumeLink = $item.find(".mp-desc p:eq(4) a").attr("href");
      const volumeText = $item.find(".mp-desc p:eq(4) strong").text().trim().replace(/\s+/g, " ");

      const readLink = $item.find(".btn-primary").attr("href");
      const infoLink = $item.find(".btn-light").attr("href");

      const rankNumber = $item.find(".number span").text().trim();

      if (id && title) {
        trending.push({
          rank: rankNumber,
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          rating: rating || null,
          languages,
          chapter: chapterText,
          chapter_link: chapterLink,
          volume: volumeText,
          volume_link: volumeLink,
          read_link: readLink,
          info_link: infoLink,
        });
      }
    });

    // ===== RECOMMENDED SECTION (Original) =====
    const recommended = [];
    $("#featured-03 .swiper-wrapper .swiper-slide").each((_, element) => {
      const $slide = $(element);
      const $item = $slide.find(".mg-item-basic");
      if (!$item.length) return;

      const link = $item.find(".link-mask").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".manga-name a").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      const rating = $item.find(".mp-desc p:eq(1)").text().replace(/[^\d.]/g, "");

      // Extract languages
      const languagesText = $item.find(".mp-desc p:eq(2)").text().trim();
      const languages = languagesText.replace(/^.*?\/\//g, "").trim();

      // Extract chapter and volume links
      const chapterLink = $item.find(".mp-desc p:eq(3) a").attr("href");
      const chapterText = $item.find(".mp-desc p:eq(3) strong").text().trim().replace(/\s+/g, " ");
      const volumeLink = $item.find(".mp-desc p:eq(4) a").attr("href");
      const volumeText = $item.find(".mp-desc p:eq(4) strong").text().trim().replace(/\s+/g, " ");

      // Extract genres
      const genres = [];
      $item.find(".fd-infor a").each((_, genreElement) => {
        const genreText = $(genreElement).text().trim().replace(",", "");
        if (genreText) genres.push(genreText);
      });

      const readLink = $item.find(".btn-primary").attr("href");
      const infoLink = $item.find(".btn-light").attr("href");

      if (id && title) {
        recommended.push({
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          rating: rating || null,
          languages,
          genres,
          chapter: chapterText,
          chapter_link: chapterLink,
          volume: volumeText,
          volume_link: volumeLink,
          read_link: readLink,
          info_link: infoLink,
        });
      }
    });

    // ===== LATEST UPDATES SECTION =====
    // Extract latest updates chapters
    const latestUpdatesChapters = [];
    $("#latest-chap .mls-wrap .item").each((_, element) => {
      const $item = $(element);
      const link = $item.find(".manga-poster").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".manga-name a").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      
      // Extract languages
      const languages = $item.find(".tick-lang").text().trim();

      // Extract genres
      const genres = [];
      $item.find(".fdi-cate a").each((_, genreElement) => {
        const genreText = $(genreElement).text().trim().replace(",", "");
        if (genreText) genres.push(genreText);
      });

      // Extract chapters
      const chapters = [];
      $item.find(".fdl-item").each((_, chapterElement) => {
        const $chapterItem = $(chapterElement);
        const chapterLink = $chapterItem.find(".chapter a").attr("href");
        const chapterText = $chapterItem.find(".chapter a").text().trim().replace(/\s+/g, " ");
        if (chapterText) {
          chapters.push({
            name: chapterText,
            link: chapterLink,
          });
        }
      });

      if (id && title) {
        latestUpdatesChapters.push({
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          languages,
          genres,
          chapters,
        });
      }
    });

    // Extract latest updates volumes
    const latestUpdatesVolumes = [];
    $("#latest-vol .mls-wrap .item").each((_, element) => {
      const $item = $(element);
      const link = $item.find(".manga-poster").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".manga-name a").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      
      // Extract languages
      const languages = $item.find(".tick-lang").text().trim();

      // Extract genres
      const genres = [];
      $item.find(".fdi-cate a").each((_, genreElement) => {
        const genreText = $(genreElement).text().trim().replace(",", "");
        if (genreText) genres.push(genreText);
      });

      // Extract volumes
      const volumes = [];
      $item.find(".fdl-item").each((_, volumeElement) => {
        const $volumeItem = $(volumeElement);
        const volumeLink = $volumeItem.find(".chapter a").attr("href");
        const volumeText = $volumeItem.find(".chapter a").text().trim().replace(/\s+/g, " ");
        if (volumeText) {
          volumes.push({
            name: volumeText,
            link: volumeLink,
          });
        }
      });

      if (id && title) {
        latestUpdatesVolumes.push({
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          languages,
          genres,
          volumes,
        });
      }
    });

    // ===== MOST VIEWED SECTION =====
    // Extract most viewed today
    const mostViewedToday = [];
    $("#chart-today .item-top, #chart-today li:not(.item-top)").each((_, element) => {
      const $item = $(element);
      const link = $item.find(".manga-poster").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".manga-name a").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      
      // Extract rank
      const rank = $item.find(".ranking-number span").text().trim();

      // Extract languages
      const languages = $item.find(".fd-infor .fdi-item").first().text().trim();

      // Extract view count
      const viewsText = $item.find(".fdi-view").text().trim();
      const views = viewsText.replace(/[^\d,]/g, "");

      // Extract genres
      const genres = [];
      $item.find(".fdi-cate a").each((_, genreElement) => {
        const genreText = $(genreElement).text().trim().replace(",", "");
        if (genreText) genres.push(genreText);
      });

      // Extract chapter and volume
      const chapter = $item.find(".fdi-chapter").eq(0).text().trim().replace(/\s+/g, " ");
      const volume = $item.find(".fdi-chapter").eq(1).text().trim().replace(/\s+/g, " ");

      if (id && title) {
        mostViewedToday.push({
          rank,
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          languages,
          views,
          genres,
          chapter: chapter || null,
          volume: volume || null,
        });
      }
    });

    // Extract most viewed week
    const mostViewedWeek = [];
    $("#chart-week .item-top, #chart-week li:not(.item-top)").each((_, element) => {
      const $item = $(element);
      const link = $item.find(".manga-poster").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".manga-name a").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      
      const rank = $item.find(".ranking-number span").text().trim();
      const languages = $item.find(".fd-infor .fdi-item").first().text().trim();
      const viewsText = $item.find(".fdi-view").text().trim();
      const views = viewsText.replace(/[^\d,]/g, "");

      const genres = [];
      $item.find(".fdi-cate a").each((_, genreElement) => {
        const genreText = $(genreElement).text().trim().replace(",", "");
        if (genreText) genres.push(genreText);
      });

      const chapter = $item.find(".fdi-chapter").eq(0).text().trim().replace(/\s+/g, " ");
      const volume = $item.find(".fdi-chapter").eq(1).text().trim().replace(/\s+/g, " ");

      if (id && title) {
        mostViewedWeek.push({
          rank,
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          languages,
          views,
          genres,
          chapter: chapter || null,
          volume: volume || null,
        });
      }
    });

    // Extract most viewed month
    const mostViewedMonth = [];
    $("#chart-month .item-top, #chart-month li:not(.item-top)").each((_, element) => {
      const $item = $(element);
      const link = $item.find(".manga-poster").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".manga-name a").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      
      const rank = $item.find(".ranking-number span").text().trim();
      const languages = $item.find(".fd-infor .fdi-item").first().text().trim();
      const viewsText = $item.find(".fdi-view").text().trim();
      const views = viewsText.replace(/[^\d,]/g, "");

      const genres = [];
      $item.find(".fdi-cate a").each((_, genreElement) => {
        const genreText = $(genreElement).text().trim().replace(",", "");
        if (genreText) genres.push(genreText);
      });

      const chapter = $item.find(".fdi-chapter").eq(0).text().trim().replace(/\s+/g, " ");
      const volume = $item.find(".fdi-chapter").eq(1).text().trim().replace(/\s+/g, " ");

      if (id && title) {
        mostViewedMonth.push({
          rank,
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          languages,
          views,
          genres,
          chapter: chapter || null,
          volume: volume || null,
        });
      }
    });

    // ===== COMPLETED SECTION =====
    const completed = [];
    $("#featured-04 .swiper-wrapper .swiper-slide").each((_, element) => {
      const $slide = $(element);
      const $item = $slide.find(".mg-item-basic");
      if (!$item.length) return;

      const link = $item.find(".link-mask").attr("href");
      const id = getMangaId(link);
      const title = $item.find(".manga-name a").text().trim();
      const imageUrl = $item.find(".manga-poster-img").attr("src");
      const rating = $item.find(".mp-desc p:eq(1)").text().replace(/[^\d.]/g, "");

      // Extract languages
      const languagesText = $item.find(".mp-desc p:eq(2)").text().trim();
      const languages = languagesText.replace(/^.*?\/\//g, "").trim();

      // Extract chapter and volume
      const chapterLink = $item.find(".mp-desc p:eq(3) a").attr("href");
      const chapterText = $item.find(".mp-desc p:eq(3) strong").text().trim().replace(/\s+/g, " ");
      const volumeLink = $item.find(".mp-desc p:eq(4) a").attr("href");
      const volumeText = $item.find(".mp-desc p:eq(4) strong").text().trim().replace(/\s+/g, " ");

      // Extract genres
      const genres = [];
      $item.find(".fd-infor a").each((_, genreElement) => {
        const genreText = $(genreElement).text().trim().replace(",", "");
        if (genreText) genres.push(genreText);
      });

      const readLink = $item.find(".btn-primary").attr("href");
      const infoLink = $item.find(".btn-light").attr("href");

      if (id && title) {
        completed.push({
          id,
          title,
          link: link || `/manga/${id}`,
          image: imageUrl,
          rating: rating || null,
          languages,
          genres,
          chapter: chapterText,
          chapter_link: chapterLink,
          volume: volumeText,
          volume_link: volumeLink,
          read_link: readLink,
          info_link: infoLink,
        });
      }
    });

    // Return the structured data
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          // Original sections
          hot_updates: hotUpdates,
          trending: trending,
          recommended: recommended,
          // New sections
          latest_updates: {
            chapters: latestUpdatesChapters,
            volumes: latestUpdatesVolumes,
          },
          most_viewed: {
            today: mostViewedToday,
            week: mostViewedWeek,
            month: mostViewedMonth,
          },
          completed: completed,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching mangareader home:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch mangareader home data.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
