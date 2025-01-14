import * as cheerio from "cheerio";
import axios from "axios";

export async function onRequest(context) {
  try {
    // Fetch the HTML content of the website
    const response = await axios.get("https://katmoviehd.nexus/");
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Initialize an array to store movie data
    const movies = [];

    // Select the movie items and extract details
    $("ul.recent-posts > li").each((index, element) => {
      const title = $(element).find("h2 > a").attr("title");
      const link = $(element).find("h2 > a").attr("href");
      const image = $(element).find(".post-thumb > a > img").attr("src");
      const categories = $(element)
        .find(".meta-category > a")
        .map((i, cat) => $(cat).text())
        .get();

      // Push the extracted data into the movies array
      movies.push({
        title,
        link,
        image,
        categories,
      });
    });

    // Return the movies data as JSON
    return new Response(JSON.stringify(movies), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching or parsing the website:", error);

    // Return an error response
    return new Response(
      JSON.stringify({ error: "Failed to fetch movies." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
