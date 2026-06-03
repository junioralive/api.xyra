import * as cheerio from "cheerio";
import axios from "axios";

const BASE = "https://dramacool9.com.ro";

function validateApiKey(apiKey, env) {
  return (env.API_KEYS || "").split(",").map(k => k.trim()).includes(apiKey);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: BASE + "/",
};

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    let apiKey, id;

    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
      id = body.id;
    } else {
      const url = new URL(request.url);
      apiKey = url.searchParams.get("api_key");
      id = url.searchParams.get("id");
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: "Missing id parameter." }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const resp = await axios.get(`${BASE}/${id}-episode-1.html`, { headers: HEADERS, validateStatus: s => s < 400 });
    if (resp.status !== 200) {
      return new Response(JSON.stringify({ success: false, error: "Drama page not found." }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const $ = cheerio.load(resp.data);

    const details = $("#drama-details");
    const title = details.find(".drama-details h1").text().trim();
    const thumbnail = details.find(".drama-thumbnail img").attr("src") || null;
    const synopsis = details.find(".synopsis p").text().trim() || null;

    // Extract metadata from p tags
    const metadata = {};
    details.find(".drama-details p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes("Country:")) metadata.country = text.replace("Country:", "").trim();
      if (text.includes("Status:")) metadata.status = text.replace("Status:", "").trim();
      if (text.includes("Release Year:")) metadata.release_year = text.replace("Release Year:", "").trim();
      if (text.includes("Genres:")) metadata.genres = text.replace("Genres:", "").split(",").map(g => g.trim()).filter(Boolean);
      if (text.includes("Starring:")) metadata.starring = text.replace("Starring:", "").split(",").map(s => s.trim()).filter(Boolean);
      if (text.includes("Duration:")) metadata.duration = text.replace("Duration:", "").trim();
      if (text.includes("Total Episodes:")) metadata.total_episodes = text.replace("Total Episodes:", "").trim();
      if (text.includes("Rating:")) metadata.rating = text.replace("Rating:", "").trim();
      if (text.includes("Content Rating:")) metadata.content_rating = text.replace("Content Rating:", "").trim();
    });

    // Also known as
    const akaEl = details.find(".drama-details p").filter((_, el) => $(el).text().includes("Also known as:"));
    if (akaEl.length) {
      metadata.other_name = akaEl.find("a").text().trim() || akaEl.text().replace("Also known as:", "").trim();
    }

    // Trailer
    const trailer = details.find(".trailer iframe").attr("src") || null;

    // Episode list
    const episodes = [];
    $(".episode-list li").each((_, el) => {
      const a = $(el).find("a");
      const epTitle = a.text().trim();
      const epHref = a.attr("href") || "";
      const epTime = $(el).find(".time").text().trim();
      episodes.push({
        title: epTitle,
        episode_id: epHref.replace(BASE, "").replace(/\.html?$/, "").replace(/^\//, ""),
        time: epTime || null,
      });
    });

    // If no episodes found from episode-list, try looking elsewhere
    if (!episodes.length) {
      $("#episode-list li, .episode li, ul.episodes li").each((_, el) => {
        const a = $(el).find("a");
        episodes.push({
          title: a.text().trim(),
          episode_id: (a.attr("href") || "").replace(BASE, "").replace(/\.html?$/, "").replace(/^\//, ""),
        });
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: title || null,
        thumbnail,
        synopsis,
        other_name: metadata.other_name || null,
        country: metadata.country || null,
        status: metadata.status || null,
        release_year: metadata.release_year || null,
        genres: metadata.genres || [],
        starring: metadata.starring || [],
        duration: metadata.duration || null,
        total_episodes: metadata.total_episodes || null,
        rating: metadata.rating || null,
        content_rating: metadata.content_rating || null,
        trailer,
        episodes,
      },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
