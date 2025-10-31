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
    const url = new URL(request.url);
    let apiKey = null;
    let mangaId = null;

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
          message: "Missing required parameter: id",
          example: "GET /v1/mangareader/info?api_key=YOUR_KEY&id=manga-title-123",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct manga URL
    const mangaUrl = `https://mangareader.to/${mangaId}`;

    // Fetch the manga info page
    const response = await axios.get(mangaUrl, {
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

    // ===== EXTRACT FROM #ani_detail SECTION =====
    
    // Extract title
    const title = $(".anisc-detail .manga-name").text().trim();
    
    // Extract alternative titles (Japanese name)
    const alternativeTitles = [];
    const altTitle = $(".anisc-detail .manga-name-or").text().trim();
    if (altTitle) alternativeTitles.push(altTitle);

    // Extract cover image
    const coverImage = $(".anisc-poster .manga-poster img").attr("src");

    // Extract genres from sort-desc section
    const genres = [];
    $(".sort-desc .genres a").each((_, el) => {
      const genre = $(el).text().trim();
      if (genre) genres.push(genre);
    });

    // Extract description
    const description = $(".sort-desc .description").text().trim();

    // Extract metadata from anisc-info items
    const metadata = {};
    $(".anisc-info-wrap .anisc-info .item-title").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".item-head").text().trim().toLowerCase().replace(":", "").replace(/\s+/g, "_");
      const value = $el.find(".name, span.name").text().trim() || 
                   $el.contents().last().text().trim();
      
      if (label && value) {
        metadata[label] = value;
      }
    });

    // Extract type (Manga/Manhwa/etc)
    let type = null;
    $(".anisc-info-wrap .anisc-info .item-title").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".item-head").text().trim();
      if (label.toLowerCase().includes("type")) {
        type = $el.find(".name").text().trim();
      }
    });

    // Extract status (Finished/Ongoing)
    let status = null;
    $(".anisc-info-wrap .anisc-info .item-title").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".item-head").text().trim();
      if (label.toLowerCase().includes("status")) {
        status = $el.find(".name").text().trim();
      }
    });

    // Extract author
    let author = null;
    $(".anisc-info-wrap .anisc-info .item-title").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".item-head").text().trim();
      if (label.toLowerCase().includes("authors")) {
        author = $el.find("a").first().text().trim();
      }
    });

    // Extract magazine
    let magazine = null;
    $(".anisc-info-wrap .anisc-info .item-title").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".item-head").text().trim();
      if (label.toLowerCase().includes("magazines")) {
        magazine = $el.find("a").first().text().trim();
      }
    });

    // Extract published date
    let published = null;
    $(".anisc-info-wrap .anisc-info .item-title").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".item-head").text().trim();
      if (label.toLowerCase().includes("published")) {
        published = $el.find(".name").text().trim();
      }
    });

    // Extract score (rating)
    let score = null;
    $(".anisc-info-wrap .anisc-info .item-title").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".item-head").text().trim();
      if (label.toLowerCase().includes("score")) {
        const scoreText = $el.find(".name").text().trim();
        if (scoreText) {
          const scoreMatch = scoreText.match(/(\d+\.?\d*)/);
          score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
        }
      }
    });

    // Extract views
    let views = null;
    $(".anisc-info-wrap .anisc-info .item-title").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".item-head").text().trim();
      if (label.toLowerCase().includes("views")) {
        views = $el.find(".name").text().trim();
      }
    });

    // Extract user rating (from voting section)
    let userRating = null;
    let userRatingCount = 0;
    const ratingMarkText = $(".dt-rate .rr-mark strong").first().text().trim();
    if (ratingMarkText) {
      const ratingMatch = ratingMarkText.match(/(\d+\.?\d*)/);
      userRating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
    }
    const votedText = $(".dt-rate .rr-mark small").text().trim();
    if (votedText) {
      const votedMatch = votedText.match(/(\d+)/);
      userRatingCount = votedMatch ? parseInt(votedMatch[1]) : 0;
    }

    // Extract read link
    const readLink = $(".manga-buttons .btn-primary").attr("href");

    // Extract available languages for chapters and volumes
    const availableLanguages = {
      chapters: [],
      volumes: []
    };

    // Get available chapter languages from dropdown menu
    $(".c-select-lang").each((_, el) => {
      const $el = $(el);
      let text = $el.text().trim();
      const dataCode = $el.attr("data-code");
      const dataType = $el.attr("data-type");
      
      // Remove extra whitespace and newlines
      text = text.replace(/\s+/g, ' ');
      
      console.log("Processing c-select-lang:", { text, dataCode, dataType });
      
      // Extract language code and count from text like "[JA] Japanese (31 chapters)"
      const match = text.match(/\[(.*?)\]\s+(.*?)\s+\((\d+)/);
      if (match) {
        console.log("Match found:", { code: dataCode, name: match[2].trim(), count: match[3] });
        availableLanguages.chapters.push({
          code: dataCode,
          name: match[2].trim(),
          count: parseInt(match[3])
        });
      } else {
        console.log("No match for:", text);
      }
    });

    // Get available volume languages from dropdown menu
    $(".v-select-lang").each((_, el) => {
      const $el = $(el);
      let text = $el.text().trim();
      const dataCode = $el.attr("data-code");
      const dataType = $el.attr("data-type");
      
      // Remove extra whitespace and newlines
      text = text.replace(/\s+/g, ' ');
      
      console.log("Processing v-select-lang:", { text, dataCode, dataType });
      
      // Extract language code and count from text like "[JA] Japanese (4 volumes)"
      const match = text.match(/\[(.*?)\]\s+(.*?)\s+\((\d+)/);
      if (match) {
        console.log("Match found:", { code: dataCode, name: match[2].trim(), count: match[3] });
        availableLanguages.volumes.push({
          code: dataCode,
          name: match[2].trim(),
          count: parseInt(match[3])
        });
      } else {
        console.log("No match for:", text);
      }
    });
    
    console.log("Final available_languages:", availableLanguages);

    // Extract chapters from the active language
    const chapters = [];
    const activeChapterList = $(".reading-list.active, #en-chapters");
    activeChapterList.find(".chapter-item").each((_, el) => {
      const $el = $(el);
      const chapterLink = $el.find(".item-link").attr("href");
      const chapterName = $el.find(".name").text().trim();
      
      // Chapter number from data-number attribute (optional)
      const chapterNumber = $el.attr("data-number");

      if (chapterName && chapterLink) {
        chapters.push({
          number: chapterNumber || null,
          name: chapterName,
          link: chapterLink,
        });
      }
    });

    // Extract volumes from the active language (optional - if available)
    const volumes = [];
    const activeVolumeList = $(".manga_list-wrap.active, #en-volumes");
    activeVolumeList.find(".item").each((_, el) => {
      const $el = $(el);
      const volumeLink = $el.find(".link-mask").attr("href");
      const volumeText = $el.find(".tick-vol").text().trim();
      const volumeImage = $el.find(".manga-poster-img").attr("src");

      if (volumeText && volumeLink) {
        volumes.push({
          name: volumeText,
          link: volumeLink,
          image: volumeImage || null,
        });
      }
    });

    // Related/Recommended manga (if available on page)
    const relatedManga = [];
    $(".block_area_authors-other .item-spc").each((_, el) => {
      const $el = $(el);
      
      // Get manga link and ID
      const mangaLink = $el.find(".manga-poster").attr("href");
      const mangaId = getMangaId(mangaLink);
      
      // Get manga title
      const mangaTitle = $el.find(".manga-name a").text().trim();
      
      // Get manga image
      const mangaImage = $el.find(".manga-poster-img").attr("src");
      
      // Get genres
      const genres = [];
      $el.find(".fdi-cate a").each((_, genreEl) => {
        const genre = $(genreEl).text().trim();
        if (genre) genres.push(genre);
      });
      
      // Get latest chapters
      const latestChapters = [];
      $el.find(".fd-list .fdl-item").each((_, chapEl) => {
        const $chap = $(chapEl);
        const chapterLink = $chap.find(".chapter a").attr("href");
        let chapterText = $chap.find(".chapter a").text().trim();
        
        // Clean up whitespace and newlines in chapter text
        chapterText = chapterText.replace(/\s+/g, ' ').trim();
        
        if (chapterText && chapterLink) {
          latestChapters.push({
            name: chapterText,
            link: chapterLink
          });
        }
      });
      
      // Get available languages
      const languages = $el.find(".tick-lang").text().trim();

      if (mangaId && mangaTitle) {
        relatedManga.push({
          id: mangaId,
          title: mangaTitle,
          link: mangaLink,
          image: mangaImage || null,
          genres: genres.length > 0 ? genres : null,
          languages: languages || null,
          latest_chapters: latestChapters.length > 0 ? latestChapters : null
        });
      }
    });

    // Extract "You May Also Like" recommendations
    const youMayLike = [];
    $(".block_area-realtime .item-top").each((_, el) => {
      const $el = $(el);
      
      // Get manga link and ID
      const mangaLink = $el.find(".manga-poster").attr("href");
      const mangaId = getMangaId(mangaLink);
      
      // Get manga title
      const mangaTitle = $el.find(".manga-name a").text().trim();
      
      // Get manga image
      const mangaImage = $el.find(".manga-poster-img").attr("src");
      
      // Get genres
      const genres = [];
      $el.find(".fdi-cate a").each((_, genreEl) => {
        const genre = $(genreEl).text().trim();
        if (genre) genres.push(genre);
      });
      
      // Get chapter and volume links
      const recommendations = [];
      $el.find(".d-block .fdi-chapter a").each((_, recEl) => {
        const $rec = $(recEl);
        let recText = $rec.text().trim();
        const recLink = $rec.attr("href");
        
        // Clean whitespace
        recText = recText.replace(/\s+/g, ' ').trim();
        
        if (recText && recLink) {
          recommendations.push({
            name: recText,
            link: recLink
          });
        }
      });

      if (mangaId && mangaTitle) {
        youMayLike.push({
          id: mangaId,
          title: mangaTitle,
          link: mangaLink,
          image: mangaImage || null,
          genres: genres.length > 0 ? genres : null,
          recommendations: recommendations.length > 0 ? recommendations : null
        });
      }
    });

    // Return the structured data
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: mangaId,
          title,
          alternative_titles: alternativeTitles,
          cover_image: coverImage,
          description,
          genres,
          type,
          status,
          author,
          magazine,
          published,
          score,
          views,
          user_rating: {
            rating: userRating,
            votes: userRatingCount,
          },
          metadata,
          available_languages: availableLanguages,
          chapters,
          volumes: volumes.length > 0 ? volumes : null,
          authors_related: relatedManga.length > 0 ? relatedManga : null,
          you_may_like: youMayLike.length > 0 ? youMayLike : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching mangareader info:", error);

    // Check if it's a 404 error
    if (error.response?.status === 404) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Manga not found.",
          message: "The manga ID provided does not exist on MangaReader.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch manga information.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
