import * as cheerio from "cheerio";
import axios from "axios";

export async function onRequest() {
  try {
    // Fetch the HTML content of the website
    const response = await axios.get("https://kisskh.asia/");
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Initialize arrays to store "Latest Release", "Recommendation", and "Popular Drama" data
    const latestReleases = [];
    const recommendations = [];
    const popularDrama = {
      weekly: [],
      monthly: [],
      alltime: []
    };

    // Extract "Latest Release" section
    $(".bixbox .listupd .excstf article").each((_, element) => {
      const title = $(element).find(".tt h2").text().trim();
      const link = $(element).find(".bsx > a").attr("href");
      const image = $(element).find(".bsx img").attr("src");
      const episode = $(element).find(".bt .epx").text().trim();
      const subtitle = $(element).find(".bt .sb").text().trim();
      const status = $(element).find(".limit .status").text().trim() || "Ongoing";

      latestReleases.push({
        title,
        link,
        image,
        status,
        episode,
        subtitle,
      });
    });

    // Extract "Recommendation" section by genre
    $(".series-gen .nav-tabs li").each((_, tab) => {
      const genreName = $(tab).find("a").text().trim();
      const genreId = $(tab).find("a").attr("href").replace("#", "");
      const genreRecommendations = [];

      $(`#${genreId} article`).each((_, element) => {
        const title = $(element).find(".tt h2").text().trim();
        const link = $(element).find(".bsx > a").attr("href");
        const image = $(element).find(".bsx img").attr("src");
        const status = $(element).find(".bt .epx").text().trim() || "Ongoing";
        const subtitle = $(element).find(".bt .sb").text().trim();

        genreRecommendations.push({
          title,
          link,
          image,
          status,
          subtitle,
        });
      });

      if (genreRecommendations.length > 0) {
        recommendations.push({
          [genreName]: genreRecommendations,
        });
      }
    });

    // Extract "Popular Drama" section
    $(".serieslist.pop.wpop").each((_, section) => {
      const range = $(section).attr("class").split(" ").find((cls) => cls.startsWith("wpop-")).replace("wpop-", "");

      $(section).find("li").each((_, element) => {
        const rank = $(element).find(".ctr").text().trim();
        const title = $(element).find(".leftseries h4 a").text().trim();
        const link = $(element).find(".imgseries a").attr("href");
        const image = $(element).find(".imgseries img").attr("src");
        const genres = [];

        $(element).find(".leftseries span a").each((_, genre) => {
          genres.push($(genre).text().trim());
        });

        const rating = $(element).find(".numscore").text().trim() || null;

        popularDrama[range].push({
          rank,
          title,
          link,
          image,
          genres,
          rating,
        });
      });
    });

    // Return the data in the desired JSON structure
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          latest_release: latestReleases,
          recommendation: recommendations,
          popular_drama: popularDrama,
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
