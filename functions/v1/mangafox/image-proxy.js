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

    // Validate URL is from fanfox CDN
    if (!imageUrl.includes("fmcdn.mfcdn.net")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid image source. Only fanfox images are allowed.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch image with proper headers
    const response = await axios.get(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Referer": "https://fanfox.net/",
        "Accept": "image/*",
      },
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const contentType = response.headers["content-type"] || "image/jpeg";

    return new Response(response.data, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        "Content-Length": response.data.length,
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
