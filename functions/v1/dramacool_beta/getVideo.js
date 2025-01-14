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

        const obfuscatedCode = searchParams.get("obfuscatedCode") || "";
        const deobfuscationKey = parseInt(searchParams.get("deobfuscationKey"), 10) || 36;
        const arrayLength = parseInt(searchParams.get("arrayLength"), 10) || 509;
        const deobfuscationArray = (searchParams.get("deobfuscationArray") || "").split("|");

        // Validate inputs
        if (!obfuscatedCode || !deobfuscationArray.length) {
            return new Response("Invalid input data", { status: 400 });
        }

        // Deobfuscate the code
        const deobfuscatedOutput = deobfuscateCode(
            obfuscatedCode,
            deobfuscationKey,
            arrayLength,
            deobfuscationArray
        );

        // Extract URLs
        const urls = extractUrls(deobfuscatedOutput);

        // Find specific URLs
        const result = findSpecificUrls(urls);

        // Return the response
        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
        });
    } else if (request.method === "POST") {
        try {
            const body = await request.json();
            const {
                obfuscatedCode = "",
                deobfuscationKey = 36,
                arrayLength = 509,
                deobfuscationArray = "",
            } = body;

            // Validate inputs
            if (!obfuscatedCode || !deobfuscationArray.length) {
                return new Response("Invalid input data", { status: 400 });
            }

            // Deobfuscate the code
            const deobfuscatedOutput = deobfuscateCode(
                obfuscatedCode,
                deobfuscationKey,
                arrayLength,
                deobfuscationArray.split("|")
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
            return new Response("Error parsing JSON input", { status: 400 });
        }
    }

    // Unsupported request method
    return new Response("Unsupported request method", { status: 405 });
}
