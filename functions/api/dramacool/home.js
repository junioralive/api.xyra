import * as cheerio from "cheerio";
import axios from "axios";

// Function to validate API key
function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",");
  return validApiKeys.includes(apiKey);
}

export async function onRequest({ request, env }) {
  try {
    const url = new URL(request.url);
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

    // Fetch the HTML content of the website
    const response = await axios.get("https://dramacool.sh/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://dramacool.sh/'
      }
    });
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Initialize arrays to store data for different sections
    const recentlyAddedDramas = [];
    const recentMovies = [];
    const recentKShows = [];
    const blogContent = [];
    const ongoingDramas = [];
    const upcomingEpisodes = [];
    const mostPopularDramas = [];

    // Extract "Recently Added Drama"
    $("#drama .box li").each((_, element) => {
      const title = $(element).find("h3").text().trim();
      const id = $(element).find("a").attr("href").replace("https://dramacool.sh", "").replace("/", "").replace("/", "");
      const image = $(element).find("img").attr("data-src");
      const episode = $(element).find(".ep").text().trim();
      const time = $(element).find(".time").text().trim();

      // Modify the link to remove "-episode-*" part
      const cleanLink = id.replace(/-episode-\d+/i, "");

      recentlyAddedDramas.push({
        title,
        id: cleanLink,
        original_id: id,
        image,
        episode,
        time,
      });
    });

    // Extract "Recent Movie"
    $("#movie .box li").each((_, element) => {
      const title = $(element).find("h3").text().trim();
      const id = $(element).find("a").attr("href").replace("https://dramacool.sh", "").replace("/", "").replace("/", "");
      const image = $(element).find("img").attr("src");

      // Modify the link to remove "-episode-*" part
      const cleanLink = id.replace(/-episode-\d+/i, "");

      recentMovies.push({
        title,
        id: cleanLink,
        original_id: id,
        image,
      });
    });

    // Extract "Recent K-Show"
    $("#kshow .box li").each((_, element) => {
      const title = $(element).find("h3").text().trim();
      const id = $(element).find("a").attr("href").replace("https://dramacool.sh", "").replace("/", "").replace("/", "");
      const image = $(element).find("img").attr("src");
      const episode = $(element).find(".ep").text().trim();
      const time = $(element).find(".time").text().trim();

      // Modify the link to remove "-episode-*" part
      const cleanLink = id.replace(/-episode-\d+/i, "");

      recentKShows.push({
        title,
        id: cleanLink,
        original_id: id,
        image,
        episode,
        time,
      });
    });

    // Extract "Blog Content"
    $(".blog-content .box li").each((_, element) => {
      const title = $(element).find("h3").text().trim();
      const link = $(element).find("a").attr("href");
      const image = $(element).find("img").attr("src");

      // Modify the link to remove "-episode-*" part
      const cleanLink = link.replace(/-episode-\d+/i, "");

      blogContent.push({
        title,
        link: cleanLink,
        original_link: link,
        image,
      });
    });

    // Extract "Ongoing Dramas"
    $("#popular .short-list li h3 a").each((_, element) => {
      const title = $(element).text().trim();
      const id = $(element).attr("href").replace("https://dramacool.sh", "").replace("/", "").replace("/", "");

      // Modify the link to remove "-episode-*" part
      const cleanLink = id.replace(/-episode-\d+/i, "");

      ongoingDramas.push({
        title,
        id: cleanLink,
        original_id: id,
      });
    });

    // Extract "Upcoming Episodes"
    $("#upcoming .short-list li h3 a").each((_, element) => {
      const title = $(element).text().trim();
      const id = $(element).attr("href").replace("https://dramacool.sh", "").replace("/", "").replace("/", "");

      // Modify the link to remove "-episode-*" part
      const cleanLink = id.replace(/-episode-\d+/i, "");

      upcomingEpisodes.push({
        title,
        id: cleanLink,
        original_id: id,
      });
    });

    // Extract "Most Popular Dramas"
    $(".popular-mob .widget-list li").each((_, element) => {
      const title = $(element).find("h3 a").text().trim();
      const id = $(element).find("h3 a").attr("href").replace("https://dramacool.sh", "").replace("/", "").replace("/", "");
      
      // Modify the link to remove "-episode-*" part
      const cleanLink = id.replace(/-episode-\d+/i, "");

      mostPopularDramas.push({
        title,
        id: cleanLink,
        original_id: id,
      });
    });

    // Return the data in the desired JSON structure
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          recently_added: recentlyAddedDramas,
          recent_movie: recentMovies,
          recent_k_show: recentKShows,
          //blog: blogContent,
          ongoing: ongoingDramas,
          upcoming: upcomingEpisodes,
          popular: mostPopularDramas,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching or parsing the website:", error);

    // Return an error response
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch data." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
