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
    let chapterSlug = null;

    const url = new URL(request.url);

    if (request.method === "POST") {
      const contentType = request.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        apiKey = body.api_key;
        mangaId = body.id;
        chapterSlug = body.chapter;
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
      chapterSlug = url.searchParams.get("chapter");
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Method not allowed. Use GET or POST.",
        }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!mangaId || !chapterSlug) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required parameters: id and chapter",
          example: "GET /v1/manganato/chapter?api_key=YOUR_KEY&id=marriagetoxin&chapter=chapter-167",
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

    const chapterUrl = `https://www.manganato.gg/manga/${mangaId}/${chapterSlug}`;
    const response = await axios.get(chapterUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const images = [];
    $(".container-chapter-reader img").each((_, img) => {
      const src = $(img).attr("src");
      if (src) {
        images.push(getProxyImageUrl(src, baseUrl));
      }
    });

    const title = $(".current-chapter").text().trim() || `${mangaId} ${chapterSlug}`;

    // Fetch chapter list to determine prev/next navigation
    let prevChapter = null;
    let nextChapter = null;

    try {
      const chaptersResponse = await axios.get(`https://www.manganato.gg/api/manga/${mangaId}/chapters`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      });

      if (chaptersResponse.data && chaptersResponse.data.success && chaptersResponse.data.data) {
        const chapters = chaptersResponse.data.data.chapters;
        const currentIndex = chapters.findIndex((ch) => ch.chapter_slug === chapterSlug);

        if (currentIndex !== -1) {
          // The API returns chapters in descending order (newest first)
          // So next chapter is currentIndex - 1, prev chapter is currentIndex + 1
          if (currentIndex > 0) {
            const nextCh = chapters[currentIndex - 1];
            nextChapter = {
              name: nextCh.chapter_name,
              slug: nextCh.chapter_slug,
              link: `https://www.manganato.gg/manga/${mangaId}/${nextCh.chapter_slug}`,
            };
          }
          
          if (currentIndex < chapters.length - 1) {
            const prevCh = chapters[currentIndex + 1];
            prevChapter = {
              name: prevCh.chapter_name,
              slug: prevCh.chapter_slug,
              link: `https://www.manganato.gg/manga/${mangaId}/${prevCh.chapter_slug}`,
            };
          }
        }
      }
    } catch (navError) {
      console.error("Error fetching chapter navigation for", mangaId, navError);
      // Continue without navigation if it fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: mangaId,
          chapter: chapterSlug,
          title,
          images,
          navigation: {
            prev: prevChapter,
            next: nextChapter,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching manganato chapter:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch manganato chapter data.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
