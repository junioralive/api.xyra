// Swapped filters dictionary
const filters = {
    type: {
        "Movie": 'movie',
        "Drama": 'drama',
    },
    country: {
      "Chinese": 'chinese',
      "Korean": 'korean',
      "Japanese": 'japanese',
      "Thailand": 'thailand',
      "Taiwanese": 'taiwanese',
      "Indian": 'indian',
      "Hong Kong": 'hong-kong',
      "Other Asia": 'other-asia',
      "South Korea": 'south-korea',
    },
    genre: {
      "Drama": 'drama',
      "Romance": 'romance',
      "Comedy": 'comedy',
      "Action": 'action',
      "Mystery": 'mystery',
      "Thriller": 'thriller',
      "Fantasy": 'fantasy',
      "Historical": 'historical',
      "Youth": 'youth',
      "Crime": 'crime',
      "Life": 'life',
      "Family": 'family',
      "Web Series": 'web-series',
      "School": 'school',
      "Friendship": 'friendship',
      "Suspense": 'suspense',
      "Horror": 'horror',
      "Novel": 'novel',
      "Investigation": 'investigation',
      "Adventure": 'adventure',
      "Miniseries": 'miniseries',
      "Melodrama": 'melodrama',
      "BL": 'bl',
      "Supernatural": 'supernatural',
      "Detective": 'detective',
      "Business": 'business',
      "Manga": 'manga',
      "Variety": 'variety',
      "Medical": 'medical',
      "Food": 'food',
      "Sci-fi": 'sci-fi',
      "Music": 'music',
      "Variety Show": 'variety-show',
      "Sports": 'sports',
      "Psychological": 'psychological',
      "Wuxia": 'wuxia',
      "Musical": 'musical',
      "Revenge": 'revenge',
      "Law": 'law',
      "Martial Arts": 'martial-arts',
      "War": 'war',
      "Documentary": 'documentary',
      "Murder": 'murder',
      "Political": 'political',
      "Time Travel": 'time-travel',
      "Workplace": 'workplace',
      "Childhood": 'childhood',
      "History": 'history',
      "LGBTQ+": 'lgbtq',
      "Tokusatsu": 'tokusatsu',
      "Cohabitation": 'cohabitation',
      "Mature": 'mature',
      "Amnesia": 'amnesia',
      "Military": 'military',
      "Cold Man": 'cold-man',
      "Teamwork": 'teamwork',
      "Period": 'period',
      "Betrayal": 'betrayal',
      "Serial Killer": 'serial-killer',
      "Accident": 'accident',
      "Corruption": 'corruption',
      "Hidden Identity": 'hidden-identity',
      "Trauma": 'trauma',
      "Science-Fiction": 'science-fiction',
      "Survival": 'survival',
      "Tragedy": 'tragedy',
      "Reality Show": 'reality-show',
      "Legal": 'legal',
      "Modern": 'modern',
      "Conspiracy": 'conspiracy',
      "Gangster": 'gangster',
      "Human": 'human',
      "Based on True Story": 'based-on-true-story',
      "Zombie": 'zombie',
      "Contract Relationship": 'contract-relationship',
      "Slice of Life": 'slice-of-life',
      "Sitcom": 'sitcom',
      "Criminal": 'criminal',
      "Neighbours": 'neighbours',
      "Lesbian": 'lesbian',
      "Demon": 'demon',
      "Bromance": 'bromance',
      "Manhua": 'manhua',
      "Resurrection": 'resurrection',
      "Bodyguard": 'bodyguard',
      "Noir": 'noir',
      "Romantic": 'romantic',
      "Period Drama": 'period-drama',
      "Disaster": 'disaster',
      "Sismance": 'sismance',
      "Webtoon": 'webtoon',
      "Reality": 'reality',
      "Kidnapping": 'kidnapping',
      "Animals": 'animals',
      "Biography": 'biography',
      "Police": 'police',
      "Fashion": 'fashion',
      "Vampire": 'vampire',
      "Magic": 'magic',
      "Medical Drama": 'medical-drama',
      "Underworld": 'underworld',
      "Rich Man": 'rich-man',
      "Curse": 'curse',
      "Entertainment": 'entertainment',
      "Historical Drama": 'historical-drama',
      "High School": 'high-school',
      "Harem": 'harem',
      "Robot": 'robot',
      "Short": 'short',
      "Samurai": 'samurai',
      "Espionage": 'espionage',
      "Exorcism": 'exorcism',
      "Monster": 'monster',
      "Love": 'love',
      "Mafia": 'mafia',
      "Alien": 'alien',
      "Crime Drama": 'crime-drama',
      "Crime Thriller": 'crime-thriller',
      "Teen": 'teen',
      "Sport": 'sport',
      "Women": 'women',
      "Coma": 'coma',
      "Gumiho": 'gumiho',
      "Phobia": 'phobia',
      "Swordsman": 'swordsman',
      "Warrior": 'warrior',
      "Terrorist": 'terrorist',
      "Modern Romance": 'modern-romance',
      "Renzoku": 'renzoku',
      "Based on a Comic": 'based-on-a-comic',
      "School Life": 'school-life',
      "Game": 'game',
      "Nature": 'nature',
      "Artificial Intelligence": 'artificial-intelligence',
      "Witch": 'witch',
      "Power Struggle": 'power-struggle',
      "Josei": 'josei',
      "School Comedy": 'school-comedy',
      "Romantic Comedy": 'romantic-comedy',
      "Ancient Wuxia Fantasy": 'ancient-wuxia-fantasy',
      "Reality TV": 'reality-tv',
      "Professional": 'professional',
      "Mother & Son": 'mother-son',
    },
    release_year: {
      "2025": '2025',
      "2024": '2024',
      "2023": '2023',
      "2022": '2022',
      "2021": '2021',
      "2020": '2020',
      "2019": '2019',
      "2018": '2018',
      "2017": '2017',
      "2016": '2016',
      "2015": '2015',
      "2014": '2014',
      "2013": '2013',
      "2012": '2012',
      "2011": '2011',
      "2010": '2010',
      "2009": '2009',
      "2008": '2008',
      "2007": '2007',
      "2006": '2006',
      "2005": '2005',
      "2004": '2004',
      "2003": '2003',
      "2002": '2002',
      "2001": '2001',
      "2000": '2000',
      "1999": '1999',
      "1998": '1998',
      "1996": '1996',
    },
  };

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

        if (request.method === "POST") {
            // Parse JSON body for API key
            const contentType = request.headers.get("Content-Type") || "";
            if (contentType.includes("application/json")) {
                const body = await request.json();
                apiKey = body.api_key;
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
            // Retrieve API key from query parameters for GET requests
            const url = new URL(request.url);
            apiKey = url.searchParams.get("api_key");
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

        // Return the filters data
        return new Response(
            JSON.stringify({
                success: true,
                data: filters,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        // Handle unexpected errors
        return new Response(
            JSON.stringify({
                success: false,
                message: error.message,
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
}