import * as cheerio from "cheerio";
import axios from "axios";

// Function to validate API key
function validateApiKey(apiKey, env) {
    const validApiKeys = (env.API_KEYS || "").split(",").map(key => key.trim());
    return validApiKeys.includes(apiKey);
}

export async function onRequest({ request, env }) {
    // Define CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400", // Cache preflight response for 24 hours
    };

    // Handle preflight OPTIONS requests
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        let apiKey = null;
        let query = null;
        let page = "1";

        if (request.method === "POST") {
            // Parse JSON body for POST requests
            const contentType = request.headers.get("Content-Type") || "";
            if (contentType.includes("application/json")) {
                const body = await request.json();
                apiKey = body.api_key;
                query = body.query;
                page = body.page || page;
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
            // Extract parameters from query string for GET requests
            const url = new URL(request.url);
            apiKey = url.searchParams.get("api_key");
            query = url.searchParams.get("query");
            page = url.searchParams.get("page") || page;
        } else {
            // Method not allowed
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
                    message: "Invalid or missing API key. You can’t call this a drama API without the drama of finding your missing key!",
                    protip: "Missing API key? Join our Discord and claim yours—it’s free, and way better than staring at this error. 👉 https://discord.gg/cwDTVKyKJz",
                }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Ensure query parameter is provided
        if (!query) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Missing 'query' parameter.",
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Construct the target URL
        const targetUrl = `https://dramacool.sh/page/${page}/?s=${encodeURIComponent(query)}`;

        // Fetch the HTML content of the provided URL
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://dramacool.sh/',
            },
        });
        const html = response.data;

        // Load the HTML into cheerio
        const $ = cheerio.load(html);

        // Initialize an array to store data for the search results
        const dramas = [];

        // Extract drama details from the #main.site-main.wrapper
        $("#main.site-main.wrapper .list-thumb li").each((_, element) => {
            const title = $(element).find("h2 a").text().trim();
            const idAttr = $(element).find("h2 a").attr("href");
            const id = idAttr ? idAttr.replace("https://dramacool.sh", "").replace("/", "").replace("/", "") : null;
            const image = $(element).find("img").attr("data-original") || $(element).find("img").attr("src") || null;
            const synopsis = $(element).find("p").not(".post-info").text().trim() || null;
            const releaseYear = $(element).find(".post-info strong:contains('Release Year:')").next("a").text().trim() || null;

            // Only add to array if title and id are present
            if (title && id) {
                dramas.push({
                    title,
                    id,
                    image,
                    synopsis,
                    releaseYear,
                });
            }
        });

        // Extract pagination details
        const nextPage = $(".pagination .next.page-numbers").attr("href") ? true : false;
        const prevPage = $(".pagination .prev.page-numbers").attr("href") ? true : false;
        const maxPage = $(".pagination .page-numbers")
            .not(".dots, .prev, .next, .current")
            .last()
            .text();

        // Return the data in the desired JSON structure
        return new Response(
            JSON.stringify({
                success: true,
                query,
                page: parseInt(page, 10),
                data: dramas,
                pagination: {
                    hasNextPage: nextPage,
                    hasPrevPage: prevPage,
                    maxPage: parseInt(maxPage) || 1,
                },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error fetching or parsing the website:", error);

        // Return an error response
        return new Response(
            JSON.stringify({
                success: false,
                error: "Failed to fetch data.",
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
}
