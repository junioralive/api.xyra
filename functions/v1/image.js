import axios from "axios";

export async function onRequest({ request, env }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (request.method !== "GET") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Method not allowed. Use GET only.",
        }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing 'url' parameter",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid URL format",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch image with generic headers
    const imageUrlObj = new URL(imageUrl);
    const customReferer = url.searchParams.get("referer");
    const referer = customReferer || `${imageUrlObj.protocol}//${imageUrlObj.hostname}/`;

    const response = await axios.get(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Referer": referer,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      responseType: "arraybuffer",
      timeout: 15000,
    });

    const contentType = response.headers["content-type"] || "image/jpeg";

    return new Response(response.data, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch image",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
