export async function onRequest(context) {
    const url = new URL(context.request.url).searchParams.get("url");

    if (!url) {
        return new Response(
            JSON.stringify({ error: "URL parameter is required." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const headers = {
        'referer': 'https://vidmoly.to/',
        'origin': 'https://vidmoly.to',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    };

    try {
        // Fetch the requested resource
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Failed to fetch resource: ${response.statusText}`);
        }

        if (url.endsWith('.m3u8')) {
            // Rewrite .m3u8 file to proxy segment URLs
            const playlist = await response.text();
            const rewrittenPlaylist = playlist.replace(
                /(https?:\/\/[^\s]+)/g,
                (match) => `/api/dramacool/stream?url=${encodeURIComponent(match)}`
            );

            return new Response(rewrittenPlaylist, {
                headers: {
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        // Proxy .ts segment files
        return new Response(response.body, {
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "video/MP2T",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Error in proxy:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
