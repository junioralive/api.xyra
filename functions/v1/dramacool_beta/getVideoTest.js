export async function onRequest(context) {
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
        const urlRegex = /(https?:\/\/[^\s"\\]+)/g;
        return text.match(urlRegex) || [];
    }

    // Function to filter specific URLs
    function findSpecificUrls(urls) {
        const streamUrl = urls.find(url => url.includes(".m3u8")) || null;
        const subUrl = urls.find(url => url.includes(".vtt")) || null;
        return { stream: streamUrl, sub: subUrl };
    }

    // Parse request inputs
    const { request } = context;

    if (request.method === "GET") {
        const { searchParams } = new URL(request.url);
        const videoURL = searchParams.get("url");

        if (!videoURL) {
            return new Response("Missing 'url' query parameter", { status: 400 });
        }

        try {
            // Fetch the HTML content from the video URL
            const response = await fetch(videoURL);
            if (!response.ok) {
                return new Response(`Failed to fetch video URL: ${response.statusText}`, { status: 500 });
            }
            const html = await response.text();

            // Extract the targeted <script> content
            const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
            let scriptContent;
            let match;
            while ((match = scriptRegex.exec(html)) !== null) {
                if (match[1].includes("eval(function(p,a,c,k,e,d)")) {
                    scriptContent = match[1];
                    break;
                }
            }

            if (!scriptContent) {
                return new Response("Obfuscated script not found in HTML.", { status: 400 });
            }

            // Extract parameters from the obfuscated code
            const evalRegex = /eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.+?)',(\d+),(\d+),'(.+?)'\.split\('\|'\)\)\)/;
            const obfuscatedMatch = scriptContent.match(evalRegex);

            if (!obfuscatedMatch) {
                return new Response("Failed to parse obfuscated code.", { status: 400 });
            }

            const [_, obfuscatedCode, deobfuscationKey, arrayLength, deobfuscationArray] = obfuscatedMatch;

            // Deobfuscate the code
            const deobfuscatedOutput = deobfuscateCode(
                obfuscatedCode,
                parseInt(deobfuscationKey, 10),
                parseInt(arrayLength, 10),
                deobfuscationArray.split('|')
            );

            // Extract URLs
            const urls = extractUrls(deobfuscatedOutput);

            // Find specific URLs
            const result = findSpecificUrls(urls);

            // Return the response
            return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            return new Response(`Error processing video URL: ${error.message}`, { status: 500 });
        }
    }

    // Unsupported request method
    return new Response("Unsupported request method", { status: 405 });
}
