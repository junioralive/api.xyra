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
    const page = url.searchParams.get("page") || "1";
    const type = url.searchParams.get("type") || "drama";
    const country = url.searchParams.get("country") || "";
    const genre = url.searchParams.get("genre") || "";
    const releaseYear = url.searchParams.get("release_year") || "";
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

    // Determine the base URL based on the type parameter
    let baseUrl;
    if (type === "movie") {
        baseUrl = "https://dramacool.sh/category/movies/";
    } else if (type === "kshow") {
        baseUrl = "https://dramacool.sh/category/k-show/";
    } else {
        baseUrl = "https://dramacool.sh/category/asian-drama/";
    }

    // Construct the query string
    const queryParams = new URLSearchParams();
    if (country) queryParams.append("country", country);
    if (genre) queryParams.append("genre", genre);
    if (releaseYear) queryParams.append("release-year", releaseYear);

    // Construct the target URL
    const targetUrl = `${baseUrl}?${queryParams.toString()}&page=${page}`;

    // Fetch the HTML content of the provided URL
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

    // Initialize an array to store data for the dramas
    const dramas = [];

    // Extract drama details inside #primary.wrapper
    $("#primary .box li").each((_, element) => {
      const title = $(element).find("h3").text().trim();
      let id = $(element).find("a").attr("href").replace("https://dramacool.sh", "").replace("/", "").replace("/", "");
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
    const maxPage = $(".pagination .page-numbers").not(".dots, .prev, .next, .current")
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

// Filters dictionary for reference
// const filters = {
//   country: {
//       'chinese': "Chinese",
//       'korean': "Korean",
//       'japanese': "Japanese",
//       'thailand': "Thailand",
//       'taiwanese': "Taiwanese",
//       'indian': "Indian",
//       'hong-kong': "Hong Kong",
//       'other-asia': "Other Asia",
//       'south-korea': "South Korea",
//   },
//   genre: {
//       'drama': "Drama",
//       'romance': "Romance",
//       'comedy': "Comedy",
//       'action': "Action",
//       'mystery': "Mystery",
//       'thriller': "Thriller",
//       'fantasy': "Fantasy",
//       'historical': "Historical",
//       'youth': "Youth",
//       'crime': "Crime",
//       'life': "Life",
//       'family': "Family",
//       'web-series': "Web Series",
//       'school': "School",
//       'friendship': "Friendship",
//       'suspense': "Suspense",
//       'horror': "Horror",
//       'novel': "Novel",
//       'investigation': "Investigation",
//       'adventure': "Adventure",
//       'miniseries': "Miniseries",
//       'melodrama': "Melodrama",
//       'bl': "BL",
//       'supernatural': "Supernatural",
//       'detective': "Detective",
//       'business': "Business",
//       'manga': "Manga",
//       'variety': "Variety",
//       'medical': "Medical",
//       'food': "Food",
//       'sci-fi': "Sci-fi",
//       'music': "Music",
//       'variety-show': "Variety Show",
//       'sports': "Sports",
//       'psychological': "Psychological",
//       'wuxia': "Wuxia",
//       'musical': "Musical",
//       'revenge': "Revenge",
//       'law': "Law",
//       'martial-arts': "Martial Arts",
//       'war': "War",
//       'documentary': "Documentary",
//       'murder': "Murder",
//       'political': "Political",
//       'time-travel': "Time Travel",
//       'workplace': "Workplace",
//       'childhood': "Childhood",
//       'history': "History",
//       'lgbtq+': "LGBTQ+",
//       'tokusatsu': "Tokusatsu",
//       'cohabitation': "Cohabitation",
//       'mature': "Mature",
//       'amnesia': "Amnesia",
//       'military': "Military",
//       'cold-man': "Cold Man",
//       'teamwork': "Teamwork",
//       'period': "Period",
//       'betrayal': "Betrayal",
//       'serial-killer': "Serial Killer",
//       'accident': "Accident",
//       'corruption': "Corruption",
//       'hidden-identity': "Hidden Identity",
//       'trauma': "Trauma",
//       'science-fiction': "Science-Fiction",
//       'survival': "Survival",
//       'tragedy': "Tragedy",
//       'reality-show': "Reality Show",
//       'legal': "Legal",
//       'modern': "Modern",
//       'conspiracy': "Conspiracy",
//       'gangster': "Gangster",
//       'human': "Human",
//       'based-on-true-story': "Based on True Story",
//       'zombie': "Zombie",
//       'contract-relationship': "Contract Relationship",
//       'slice-of-life': "Slice of Life",
//       'sitcom': "Sitcom",
//       'criminal': "Criminal",
//       'neighbours': "Neighbours",
//       'lesbian': "Lesbian",
//       'demon': "Demon",
//       'bromance': "Bromance",
//       'manhua': "Manhua",
//       'resurrection': "Resurrection",
//       'bodyguard': "Bodyguard",
//       'noir': "Noir",
//       'romantic': "Romantic",
//       'period-drama': "Period Drama",
//       'disaster': "Disaster",
//       'sismance': "Sismance",
//       'webtoon': "Webtoon",
//       'reality': "Reality",
//       'kidnapping': "Kidnapping",
//       'animals': "Animals",
//       'biography': "Biography",
//       'police': "Police",
//       'fashion': "Fashion",
//       'vampire': "Vampire",
//       'magic': "Magic",
//       'medical-drama': "Medical Drama",
//       'underworld': "Underworld",
//       'rich-man': "Rich Man",
//       'curse': "Curse",
//       'entertainment': "Entertainment",
//       'historical-drama': "Historical Drama",
//       'high-school': "High School",
//       'harem': "Harem",
//       'robot': "Robot",
//       'short': "Short",
//       'samurai': "Samurai",
//       'espionage': "Espionage",
//       'exorcism': "Exorcism",
//       'monster': "Monster",
//       'love': "Love",
//       'mafia': "Mafia",
//       'alien': "Alien",
//       'crime-drama': "Crime Drama",
//       'crime-thriller': "Crime Thriller",
//       'teen': "Teen",
//       'sport': "Sport",
//       'women': "Women",
//       'coma': "Coma",
//       'gumiho': "Gumiho",
//       'phobia': "Phobia",
//       'swordsman': "Swordsman",
//       'warrior': "Warrior",
//       'terrorist': "Terrorist",
//       'modern-romance': "Modern Romance",
//       'renzoku': "Renzoku",
//       'based-on-a-comic': "Based on a Comic",
//       'school-life': "School Life",
//       'game': "Game",
//       'nature': "Nature",
//       'artificial-intelligence': "Artificial Intelligence",
//       'witch': "Witch",
//       'power-struggle': "Power Struggle",
//       'josei': "Josei",
//       'school-comedy': "School Comedy",
//       'romantic-comedy': "Romantic Comedy",
//       'ancient-wuxia-fantasy': "Ancient Wuxia Fantasy",
//       'reality-tv': "Reality TV",
//       'professional': "Professional",
//       'mother-son': "Mother & Son",
//   },
//   release_year: {
//     '2025': "2025",
//     '2024': "2024",
//     '2023': "2023",
//     '2022': "2022",
//     '2021': "2021",
//     '2020': "2020",
//     '2019': "2019",
//     '2018': "2018",
//     '2017': "2017",
//     '2016': "2016",
//     '2015': "2015",
//     '2014': "2014",
//     '2013': "2013",
//     '2012': "2012",
//     '2011': "2011",
//     '2010': "2010",
//     '2009': "2009",
//     '2008': "2008",
//     '2007': "2007",
//     '2006': "2006",
//     '2005': "2005",
//     '2004': "2004",
//     '2003': "2003",
//     '2002': "2002",
//     '2001': "2001",
//     '2000': "2000",
//     '1999': "1999",
//     '1998': "1998",
//     '1996': "1996",
// },
// };
