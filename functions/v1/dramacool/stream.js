import * as cheerio from "cheerio";
import axios from "axios";

// Function to validate API key
function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",");
  return validApiKeys.includes(apiKey);
}

export async function onRequest(context) {
  const { request, env } = context;
  
  // Define CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400", // Cache preflight response for 24 hours
  };

  // Handle OPTIONS method for CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Function to deobfuscate code
  function deobfuscateCode(p, a, c, k, e, d) {
    while (c--) {
      if (k[c]) {
        p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
      }
    }
    return p;
  }

  // Function to extract URLs from text
  function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^"\s]+\.[^"\s]+)/g;
    return text.match(urlRegex) || [];
  }

  // Function to filter specific URLs and determine m3u8 presence
  function findSpecificUrls(urls) {
    const streamUrl = urls.find((url) => url.includes(".m3u8")) || null;
    const subUrl = urls.find((url) => url.includes(".vtt")) || null;
    const m3u8 = !!streamUrl;
    return { stream: streamUrl, sub: subUrl, m3u8 };
  }

  // Helper to see if we found any valid .m3u8 among servers
  function didFindM3U8(serversObj) {
    return Object.values(serversObj).some((server) => server.m3u8 === true);
  }

  // Reusable function to fetch a server’s HTML, look for obfuscated script, and extract .m3u8
  async function processServer(serverUrl) {
    try {
      const serverResponse = await axios.get(serverUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://dramacool.sh/",
        },
      });
      const serverHtml = serverResponse.data;

      // Step 4: Extract the targeted <script> content with cheerio
      const $ = cheerio.load(serverHtml);
      let scriptContent;
      $("script").each((_, scriptTag) => {
        const scriptData = $(scriptTag).html() || "";
        if (scriptData.includes("eval(function(p,a,c,k,e,d)")) {
          scriptContent = scriptData;
          return false; // break out of loop
        }
      });

      if (!scriptContent) {
        // No obfuscated script found
        return {
          m3u8: false,
          error: "Obfuscated script not found in server HTML.",
        };
      }

      // Step 5: Extract parameters from the obfuscated code
      const evalRegex =
        /eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.+?)',(\d+),(\d+),'(.+?)'\.split\('\|'\)\)\)/;
      const obfuscatedMatch = scriptContent.match(evalRegex);

      if (!obfuscatedMatch) {
        return {
          m3u8: false,
          error: "Failed to parse obfuscated code.",
        };
      }

      const [
        _,
        obfuscatedCode,
        deobfuscationKey,
        arrayLength,
        deobfuscationArray,
      ] = obfuscatedMatch;

      // Step 6: Deobfuscate the code
      const deobfuscatedOutput = deobfuscateCode(
        obfuscatedCode,
        parseInt(deobfuscationKey, 10),
        parseInt(arrayLength, 10),
        deobfuscationArray.split("|")
      );

      // Step 7: Extract URLs
      const urls = extractUrls(deobfuscatedOutput);

      // Step 8: Find specific URLs and m3u8 presence
      return findSpecificUrls(urls);
    } catch (error) {
      return {
        m3u8: false,
        error: `Error processing server: ${error.message}`,
      };
    }
  }

  // Initialize variables
  let apiKey = null;
  let episodeId = null;
  let page = "1";

  // Extract parameters based on request method
  if (request.method === "POST") {
    // Parse JSON body for POST requests
    const contentType = request.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body = await request.json();
        apiKey = body.api_key;
        episodeId = body.episode_id;
        page = body.page || page;
      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid JSON body.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
    episodeId = url.searchParams.get("episode_id");
    page = url.searchParams.get("page") || page;
  } else {
    // Method not allowed
    return new Response(
      JSON.stringify({
        success: false,
        message: "Method not allowed. Use GET, POST, or OPTIONS.",
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

  // Check for required episode_id
  if (!episodeId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing 'episode_id' query parameter.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Step 1: Fetch the main episode page using axios
    const episodeURL = `https://dramacool.sh/${encodeURIComponent(episodeId)}/`;
    const episodeResponse = await axios.get(episodeURL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://dramacool.sh/",
      },
    });
    const episodeHtml = episodeResponse.data;

    // Step 2: Extract server URL from w-server div (more reliable than iframe)
    const $ = cheerio.load(episodeHtml);
    const serverUrl = $('#w-server .serverslist').attr('data-server');
    
    if (!serverUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No server URL found in w-server div.",
          debug: {
            w_server_found: $('#w-server').length > 0,
            serverslist_found: $('#w-server .serverslist').length > 0,
            data_server_attr: $('#w-server .serverslist').attr('data-server'),
            all_data_servers: $('.serverslist').map((i, el) => $(el).attr('data-server')).get()
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean up the server URL (remove extra spaces)
    const cleanServerUrl = serverUrl.trim();

    // Step 3: Fetch the server page to get the iframe
    const serverResponse = await axios.get(cleanServerUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://dramacool.sh/",
      },
    });
    const serverHtml = serverResponse.data;

    // Step 4: Extract iframe source from the server page
    const $server = cheerio.load(serverHtml);
    
    // Look for iframe that contains the actual server list
    const iframeSelectors = [
      'iframe[src*="vidbasic"]',
      'iframe[src*="embed"]',
      'iframe[src*="player"]',
      'iframe'
    ];
    
    let embedIframeSrc = null;
    for (const selector of iframeSelectors) {
      embedIframeSrc = $server(selector).attr('src');
      if (embedIframeSrc) break;
    }
    
    if (!embedIframeSrc) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No embed iframe found in server page.",
          server_url: cleanServerUrl,
          debug: {
            server_html_length: serverHtml.length,
            server_html_snippet: serverHtml.substring(0, 500),
            iframe_found: $server('iframe').length,
            all_iframes: $server('iframe').map((i, el) => $server(el).attr('src')).get()
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean up the iframe src (handle relative URLs)
    let cleanEmbedIframeSrc = embedIframeSrc.trim();
    if (cleanEmbedIframeSrc.startsWith('/')) {
      const baseUrl = new URL(cleanServerUrl).origin;
      cleanEmbedIframeSrc = baseUrl + cleanEmbedIframeSrc;
    }

    // Step 5: Fetch the iframe content to get the actual server list
    const embedResponse = await axios.get(cleanEmbedIframeSrc, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: cleanServerUrl,
      },
    });
    const embedHtml = embedResponse.data;

    // Step 6: Extract server links from the embed iframe content
    const $embed = cheerio.load(embedHtml);
    const servers = {};

    // Try multiple selectors to find the server list
    const serverSelectors = [
      '#list-server-more .list-server-items li.linkserver',
      '.list-server-items li.linkserver',
      'li.linkserver',
      '.linkserver'
    ];

    let serversFound = false;
    for (const selector of serverSelectors) {
      $embed(selector).each((i, el) => {
        const provider = ($embed(el).attr('data-provider') || '').toLowerCase().replace(/\s+/g, '');
        const videoLink = $embed(el).attr('data-video') || '';
        
        if (provider && videoLink) {
          // Handle relative URLs for standard server
          let fullVideoLink = videoLink;
          if (videoLink.startsWith('/')) {
            const baseUrl = new URL(cleanEmbedIframeSrc).origin;
            fullVideoLink = baseUrl + videoLink;
          }
          
          servers[provider] = { 
            embeded_link: fullVideoLink, 
            m3u8: false,
            provider_name: $embed(el).attr('data-provider') || provider
          };
          serversFound = true;
        }
      });
      
      if (serversFound) break; // Stop if we found servers with this selector
    }

    // If no servers found, return the embed iframe URL as fallback
    if (Object.keys(servers).length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            iframe_only: {
              embeded_link: cleanEmbedIframeSrc,
              m3u8: false,
              provider_name: "Direct Embed Iframe",
              embed_only: true
            }
          },
          server_url: cleanServerUrl,
          embed_iframe_url: cleanEmbedIframeSrc,
          has_m3u8: false,
          message: "No server list found in embed iframe, returning iframe URL",
          debug: {
            embed_html_length: embedHtml.length,
            embed_html_snippet: embedHtml.substring(0, 500),
            list_server_more_found: $embed('#list-server-more').length,
            list_server_items_found: $embed('.list-server-items').length,
            linkserver_elements_found: $embed('li.linkserver').length,
            all_li_elements: $embed('li').map((i, el) => ({
              class: $embed(el).attr('class'),
              data_provider: $embed(el).attr('data-provider'),
              data_video: $embed(el).attr('data-video'),
              text: $embed(el).text().trim()
            })).get()
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 7: Process each server link, excluding doodstream, mixdrop, and mp4upload
    for (const [serverName, serverData] of Object.entries(servers)) {
      if (["doodstream", "mixdrop", "mp4upload"].includes(serverName)) {
        servers[serverName].skipped = true;
        servers[serverName].m3u8 = false; // Explicitly set m3u8 to false
        continue;
      }

      // Attempt to fetch and process the server
      const result = await processServer(serverData.embeded_link);
      if (result.stream) servers[serverName].stream = result.stream;
      if (result.sub) servers[serverName].sub = result.sub;
      if (typeof result.m3u8 !== "undefined")
        servers[serverName].m3u8 = result.m3u8;
      if (result.error) servers[serverName].error = result.error;
    }

    // Check if we've found any .m3u8 from the above servers
    const foundAnyM3U8 = didFindM3U8(servers);

    // If no .m3u8 found, return all embed links
    if (!foundAnyM3U8) {
      // Add a flag to indicate that these are embed links without m3u8
      for (const [serverName, serverData] of Object.entries(servers)) {
        if (!serverData.skipped && !serverData.m3u8) {
          servers[serverName].embed_only = true;
        }
      }
    }

    // Return the results
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: servers,
        server_url: cleanServerUrl,
        embed_iframe_url: cleanEmbedIframeSrc,
        has_m3u8: foundAnyM3U8
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Error processing episode ID: ${error.message}`,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
