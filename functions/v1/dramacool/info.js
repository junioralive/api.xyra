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
        let id = null;

        if (request.method === "POST") {
            // Parse JSON body for POST requests
            const contentType = request.headers.get("Content-Type") || "";
            if (contentType.includes("application/json")) {
                const body = await request.json();
                apiKey = body.api_key;
                id = body.id;
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
            id = url.searchParams.get("id");
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

        if (!id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Missing required parameter: id",
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Construct the target URL
        const targetUrl = `https://dramacool.sh/${id}/`;

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

        // Extract details
        const title = $("#drama-details .entry-header h1").text().trim() || null;
        const thumbnail = $("#drama-details .drama-thumbnail img").attr("src") || null;
        const synopsis = $("#drama-details .synopsis p.synopsis").text().trim() || null;
        const other_name = $("#drama-details .synopsis p.aka").text().replace("Other name: ", "").trim() || null;
        const total_episode = $("#drama-details .synopsis").html().match(/Episodes: (\d+)/)?.[1] || null;
        const duration = $("#drama-details .synopsis").html().match(/Duration: ([^<]+)/)?.[1]?.trim() || null;
        const rating = $("#drama-details .synopsis").html().match(/Content Rating: ([^<]+)/)?.[1]?.trim() || null;
        const airs = $("#drama-details .synopsis").html().match(/Airs On: ([^<]+)/)?.[1]?.trim() || null;
        const country = $("#drama-details p.country a").text().trim() || null;
        const status = $("#drama-details p.status a").text().trim() || null;
        const release_year = $("#drama-details p.release-year a").text().trim() || null;
        const genres = $("#drama-details p.genres a").map((_, el) => $(el).text().trim()).get() || null;
        const starring = $("#drama-details p.starring a").map((_, el) => $(el).text().trim()).get() || null;

        const trailerElement = $("#drama-details .trailer iframe");
        const trailer = trailerElement.length > 0 ? trailerElement.attr("src") : null;

        // Extract episode list with deduplication
        const episodesSet = new Set();
        const episodes = $("#episode-list .episode-list li").map((_, el) => {
            const episodeTitle = $(el).find("h3 a").text().trim();
            const episodeLink = $(el).find("h3 a").attr("href").trim().replace("https://dramacool.sh", "").replace("/", "").replace("/", "");
            const episodeTime = $(el).find(".time").text().trim();
            const episodeKey = `${episodeTitle}-${episodeLink}`;

            if (!episodesSet.has(episodeKey)) {
                episodesSet.add(episodeKey);
                return { title: episodeTitle, episode_id: episodeLink, time: episodeTime };
            }
        }).get();

        // Return the data in the desired JSON structure
        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    title,
                    thumbnail,
                    synopsis,
                    other_name,
                    total_episode,
                    duration,
                    rating,
                    airs,
                    country,
                    status,
                    release_year,
                    genres,
                    starring,
                    trailer,
                    episodes,
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
