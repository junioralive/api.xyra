import * as cheerio from "cheerio";
import axios from "axios";

const BASE = "https://kisskh.dk";

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
    let apiKey;
    if (request.method === "POST") {
      const body = await request.json();
      apiKey = body.api_key;
    } else {
      apiKey = new URL(request.url).searchParams.get("api_key");
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or missing API key." }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const { data: html } = await axios.get(BASE + "/", { headers: HEADERS });
    const $ = cheerio.load(html);

    // Latest Releases
    const latestReleases = [];
    $(".bixbox .listupd .excstf article").each((_, el) => {
      latestReleases.push({
        title: $(el).find(".tt h2").text().trim(),
        link: $(el).find(".bsx > a").attr("href"),
        image: $(el).find(".bsx img").attr("src") || $(el).find(".bsx img").attr("data-src"),
        status: $(el).find(".limit .status").text().trim() || "Ongoing",
        episode: $(el).find(".bt .epx").text().trim(),
        subtitle: $(el).find(".bt .sb").text().trim(),
      });
    });

    // Recommendations by genre
    const recommendations = [];
    $(".ts-wpop-series-gen .ts-wpop-nav-tabs li").each((_, tab) => {
      const genreName = $(tab).find("a").text().trim();
      const href = $(tab).find("a").attr("href") || "";
      const genreId = href.replace("#", "");
      const genreRecs = [];

      $(`#${genreId} article`).each((_, el) => {
        genreRecs.push({
          title: $(el).find(".tt h2").text().trim(),
          link: $(el).find(".bsx > a").attr("href"),
          image: $(el).find(".bsx img").attr("src") || $(el).find(".bsx img").attr("data-src"),
          status: $(el).find(".bt .epx").text().trim() || "Ongoing",
          subtitle: $(el).find(".bt .sb").text().trim(),
        });
      });

      if (genreRecs.length > 0 && genreName) {
        recommendations.push({ [genreName]: genreRecs });
      }
    });

    // Popular Drama
    const popularDrama = { weekly: [], monthly: [], alltime: [] };
    $(".serieslist.pop.wpop, .serieslist.pop.ts-wpop").each((_, section) => {
      const cls = $(section).attr("class") || "";
      let range = "weekly";
      if (cls.includes("wpop-monthly") || cls.includes("ts-wpop-monthly")) range = "monthly";
      else if (cls.includes("wpop-alltime") || cls.includes("ts-wpop-alltime")) range = "alltime";

      $(section).find("li").each((_, el) => {
        popularDrama[range].push({
          rank: $(el).find(".ctr").text().trim(),
          title: $(el).find(".leftseries h4 a").text().trim(),
          link: $(el).find(".imgseries a").attr("href"),
          image: $(el).find(".imgseries img").attr("src") || $(el).find(".imgseries img").attr("data-src"),
          genres: $(el).find(".leftseries span a").map((_, g) => $(g).text().trim()).get(),
          rating: $(el).find(".numscore").text().trim() || null,
        });
      });
    });

    return new Response(JSON.stringify({
      success: true,
      data: { latest_release: latestReleases, recommendation: recommendations, popular_drama: popularDrama },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch data." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
