import * as cheerio from "cheerio";
import axios from "axios";

// Function to validate API key
function validateApiKey(apiKey, env) {
  const validApiKeys = (env.API_KEYS || "").split(",");
  return validApiKeys.includes(apiKey);
}

export async function onRequest(context) {
  const { request, env } = context;

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

  // Only handle GET requests
  if (request.method === "GET") {
    const url = new URL(request.url);
    const episodeId = url.searchParams.get("episode_id");
    const apiKey = url.searchParams.get("api_key");

    // Validate API key
    if (!apiKey || !validateApiKey(apiKey, env)) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Invalid or missing API key. You can’t call this a drama API without the drama of finding your missing key!",
          protip:
            "Missing API key? Join our Discord and claim yours—it’s free, and way better than staring at this error. 👉 https://discord.gg/cwDTVKyKJz",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check for required episode_id
    if (!episodeId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing 'episode_id' query parameter.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // Step 1: Fetch the main episode page using axios
      const episodeURL = `https://dramacool.sh/${episodeId}/`;
      const episodeResponse = await axios.get(episodeURL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://dramacool.sh/",
        },
      });
      const episodeHtml = episodeResponse.data;

      // Step 2: Extract all server links using the same RegEx logic
      const serverRegex =
        /<div class="serverslist\s+([^"\s]+).*?"[^>]*data-server="([^"\s]+)"/gi;
      let serverMatch;
      const servers = {};

      while ((serverMatch = serverRegex.exec(episodeHtml)) !== null) {
        // Normalize server name to lowercase
        const serverName = serverMatch[1].split(" ")[0].toLowerCase();
        const serverLink = serverMatch[2];
        servers[serverName] = { embeded_link: serverLink, m3u8: false };
      }

      // No servers found
      if (Object.keys(servers).length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "No servers found in episode HTML.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Step 3: Process each server link, excluding doodstream, mixdrop, and mp4upload
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

      // If no .m3u8 found and we DO have a standard server, let's do the extra step:
      // Fetch the standard server HTML => parse #list-server-more => process those links
      if (!foundAnyM3U8 && servers["standard"] && servers["standard"].embeded_link) {
        try {
          const standardRes = await axios.get(servers["standard"].embeded_link, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9",
              Referer: "https://dramacool.sh/",
            },
          });
          const $ = cheerio.load(standardRes.data);

          // The snippet you provided:
          // <div id="list-server-more"> ... <li class="linkserver" data-provider="xxxx" data-video="xxxx">
          const subServers = {};
          $("#list-server-more .list-server-items li.linkserver").each((i, el) => {
            const provider = ($(el).attr("data-provider") || "").toLowerCase();
            const videoLink = $(el).attr("data-video") || "";

            // Skip doodstream, mixdrop, mp4upload, standard again
            if (
              ["doodstream", "mixdrop", "mp4upload", "standard"].includes(provider)
            ) {
              subServers[provider] = { embeded_link: videoLink, skipped: true, m3u8: false };
            } else if (videoLink) {
              subServers[provider] = { embeded_link: videoLink, m3u8: false };
            }
          });

          // Process each newly discovered subServer and add to main servers object
          for (const [subServerName, subServerData] of Object.entries(subServers)) {
            if (subServerData.skipped) {
              servers[subServerName] = subServerData;
              continue;
            }

            const result = await processServer(subServerData.embeded_link);
            if (result.stream) subServerData.stream = result.stream;
            if (result.sub) subServerData.sub = result.sub;
            if (typeof result.m3u8 !== "undefined")
              subServerData.m3u8 = result.m3u8;
            if (result.error) subServerData.error = result.error;

            // Add subServer to main servers object
            servers[subServerName] = subServerData;
          }
        } catch (err) {
          // Log the error and continue
          console.error(
            `Error fetching standard server's sub-servers: ${err.message}`
          );
          // Optionally, you can add an error field to the standard server
          servers["standard"].error = `Error fetching standard server's sub-servers: ${err.message}`;
        }
      }

      // Return the results
      return new Response(
        JSON.stringify({ success: true, data: servers }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error processing episode ID: ${error.message}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Unsupported request method
  return new Response(
    JSON.stringify({ success: false, error: "Unsupported request method" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
}
