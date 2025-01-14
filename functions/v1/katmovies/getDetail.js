import * as cheerio from "cheerio";
import axios from "axios";

export async function onRequest(context) {
  const myurl = new URL(context.request.url).searchParams.get("myurl");

  if (!myurl) {
    return new Response(
      JSON.stringify({ error: "myurl parameter is required." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Fetch the page content
    const response = await axios.get(myurl);
    const html = response.data;

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Extract title
    const title = $("h1.entry-title a").text().trim();

    // Extract IMDb rating
    const imdbRating = $('li:contains("IMDb Rating") a').text().trim();

    // Extract genres
    const genres = $('li:contains("Genres") a')
      .map((_, el) => $(el).text().trim())
      .get();

    // Extract language
    const language = $('li:contains("Language")')
      .text()
      .split(":")[1]
      ?.trim();

    // Extract quality
    const quality = $('li:contains("Quality")')
      .text()
      .split(":")[1]
      ?.trim();

    // Extract storyline
    const storyline = $("h2:contains('Storyline') + p").text().trim();

    // Extract download links
    const downloadLinks = [];
    $("a").each((_, link) => {
      const href = $(link).attr("href");
      const text = $(link).text().trim();

      // Check if the link is a valid download link (e.g., contains quality or size)
      if (href && (text.match(/\d+p/) || text.toLowerCase().includes("download"))) {
        const qualityMatch = text.match(/\d+p/);
        const qualityText = qualityMatch ? qualityMatch[0] : "Unknown Quality";
        downloadLinks.push({ quality: qualityText, link: href });
      }
    });

    // Return the extracted data
    const movieData = {
      title,
      imdbRating,
      genres,
      language,
      quality,
      storyline,
      downloadLinks,
    };

    return new Response(JSON.stringify(movieData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching or parsing the page:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch movie details." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
