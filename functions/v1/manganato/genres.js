import * as cheerio from "cheerio";
import axios from "axios";

function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",").map((key) => key.trim());
  return validApiKeys.includes(apiKey);
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
      apiKey = request.url.includes("?") ? new URL(request.url).searchParams.get("api_key") : null;
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

    const response = await axios.get("https://www.manganato.gg/genre/all", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const genres = [];
    
    // Extract main genres from the filter panel
    $(".tag-name li a").each((_, element) => {
      const $el = $(element);
      const title = $el.attr("title") || $el.text().trim();
      const href = $el.attr("href");
      
      if (title && href) {
        // Extract slug from href (e.g., "/genre/action" -> "action")
        const slugMatch = href.match(/\/genre\/([^/?]+)/);
        const slug = slugMatch ? slugMatch[1] : null;
        
        if (slug && slug !== "all") {
          genres.push({
            name: title,
            slug: slug,
            url: href.startsWith("http") ? href : `https://www.manganato.gg${href}`,
          });
        }
      }
    });

    // Remove duplicates and sort alphabetically
    const uniqueGenres = Array.from(new Map(genres.map(item => [item.slug, item])).values());
    uniqueGenres.sort((a, b) => a.name.localeCompare(b.name));

    // Add special categories
    const specialCategories = [
      { name: "Latest Updates", slug: "latest", type: "latest" },
      { name: "Hot Manga", slug: "hot", type: "hot" },
      { name: "New Manga", slug: "new", type: "new" },
      { name: "Completed", slug: "completed", state: "completed" },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          genres: uniqueGenres,
          special_categories: specialCategories,
          total: uniqueGenres.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching manganato genres:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch manganato genres.",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
