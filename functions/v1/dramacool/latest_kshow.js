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
        let page = "1";

        if (request.method === "POST") {
            // Parse JSON body for POST requests
            const contentType = request.headers.get("Content-Type") || "";
            if (contentType.includes("application/json")) {
                const body = await request.json();
                apiKey = body.api_key;
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

        // Construct the target URL
        const targetUrl = `https://dramacool.sh/category/latest-kshow-release/page/${page}/`;

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

        // Initialize an array to store data for the latest dramas section
        const dramas = [];

        // Extract drama details inside #primary.episode-category.wrapper
        $("#primary.episode-category.wrapper .box li").each((_, element) => {
            const title = $(element).find("h3").text().trim();
            let id = $(element).find("a").attr("href");
            const image = $(element).find("img").attr("data-original") || $(element).find("img").attr("src");
            const episode = $(element).find(".ep").text().trim();
            const time = $(element).find(".time").text().trim();

            // Modify the id to remove "-episode-*" part
            const cleanLink = id.replace(/-episode-\d+/i, "");

            dramas.push({
                title,
                id: cleanLink,
                original_id: id,
                image,
                episode,
                time,
            });
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
                data: dramas,
                pagination: {
                    nextpage: nextPage,
                    prevpage: prevPage,
                    maxpage: parseInt(maxPage) || 1,
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
