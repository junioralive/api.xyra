import * as cheerio from "cheerio";
import axios from "axios";

// Function to validate API key
function validateApiKey(apiKey, env) {
    const validApiKeys = (env.API_KEYS || "").split(",");
    return validApiKeys.includes(apiKey);
}

export async function onRequest({ request, env }) {
  try {
    // Parse the URL and extract parameters
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const page = url.searchParams.get("page") || "1";
    const apiKey = url.searchParams.get("api_key");

    // Validate API key
    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(
          JSON.stringify({
              success: false,
              message: "Invalid or missing API key. You can’t call this a drama API without the drama of finding your missing key!",
              protip: "Missing API key? Join our Discord and claim yours—it’s free, and way better than staring at this error. 👉 https://discord.gg/cwDTVKyKJz"
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ensure query parameter is provided
    if (!query) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Missing 'query' parameter.",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Construct the target URL
    const targetUrl = `https://dramacool.sh/?s=${encodeURIComponent(query)}&page=${page}`;

    // Fetch the HTML content of the provided URL with additional headers
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://dramacool.sh/'
      }
    });
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Initialize an array to store data for the search results
    const dramas = [];

    // Extract drama details from the #main.site-main.wrapper
    $("#main.site-main.wrapper .list-thumb li").each((_, element) => {
        const title = $(element).find("h2 a").text().trim();
        const id = $(element).find("h2 a").attr("href").replace("https://dramacool.sh", "").replace("/", "").replace("/", "");
        const image = $(element).find("img").attr("data-original") || $(element).find("img").attr("src");
        const synopsis = $(element).find("p").not(".post-info").text().trim();
        const releaseYear = $(element).find(".post-info strong:contains('Release Year:')").next("a").text().trim();

        // Only add to array if title and id are present (minimum required fields)
        if (title && id) {
            dramas.push({
                title,
                id,
                image: image || null, // Default to null if image is not found
                synopsis: synopsis || null, // Default to null if synopsis is not found
                releaseYear: releaseYear || null, // Default to null if release year is not found
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
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching or parsing the website:", error);

    // Return an error response
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch data.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}