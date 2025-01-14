// Function to validate API key
function validateApiKey(apiKey, env) {
    const validApiKeys = (env.API_KEYS || "").split(",");
    return validApiKeys.includes(apiKey);
}

// Function to deobfuscate code
function deobfuscateCode(p, a, c, k) {
    while (c--) {
        if (k[c]) {
            p = p.replace(new RegExp(`\\b${c.toString(a)}\\b`, "g"), k[c]);
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
    const streamUrl = urls.find((url) => url.includes(".m3u8")) || null;
    const subUrl = urls.find((url) => url.includes(".vtt")) || null;
    return { stream: streamUrl, sub: subUrl };
}

export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (!["GET", "POST"].includes(method)) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Only GET and POST requests are supported.",
            }),
            { status: 405, headers: { "Content-Type": "application/json" } }
        );
    }

    let apiKey;
    let videoURL;

    if (method === "GET") {
        const { searchParams } = new URL(request.url);
        apiKey = searchParams.get("api_key");
        videoURL = searchParams.get("url");
    } else if (method === "POST") {
        const body = await request.json();
        apiKey = body.api_key;
        videoURL = body.url;
    }

    if (!apiKey || !validateApiKey(apiKey, env)) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Invalid or missing API key. Please provide a valid API key.",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }

    if (!videoURL) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Missing 'url' parameter. Please provide a valid video URL.",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const response = await fetch(videoURL);

        if (!response.ok) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: `Failed to fetch the video URL. Received status: ${response.statusText}.`,
                }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const html = await response.text();

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
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "No obfuscated script found in the provided URL.",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const evalRegex = /eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.+?)',(\d+),(\d+),'(.+?)'\.split\('\|\'\)\)\)/;
        const obfuscatedMatch = scriptContent.match(evalRegex);

        if (!obfuscatedMatch) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Failed to parse the obfuscated script.",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const [_, obfuscatedCode, deobfuscationKey, arrayLength, deobfuscationArray] = obfuscatedMatch;

        const deobfuscatedOutput = deobfuscateCode(
            obfuscatedCode,
            parseInt(deobfuscationKey, 10),
            parseInt(arrayLength, 10),
            deobfuscationArray.split("|")
        );

        const urls = extractUrls(deobfuscatedOutput);
        const result = findSpecificUrls(urls);

        return new Response(
            JSON.stringify({
                success: true,
                data: result,
            }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                message: `An error occurred while processing the request: ${error.message}`,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
