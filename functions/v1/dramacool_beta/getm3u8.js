import axios from "axios";
import * as cheerio from "cheerio";

export async function onRequest(context) {
    const pageUrl = new URL(context.request.url).searchParams.get("url");

    if (!pageUrl) {
        return new Response(
            JSON.stringify({ error: "URL parameter is required." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        // Step 1: Fetch the initial page
        const pageResponse = await axios.get(pageUrl);
        const $ = cheerio.load(pageResponse.data);

        // Step 2: Extract the iframe src
        const iframeSrc = $('iframe[title*="Episode"]').attr('src');

        if (!iframeSrc) {
            return new Response(
                JSON.stringify({ error: "Iframe source not found." }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const iframeUrl = iframeSrc.startsWith("http") ? iframeSrc : `https:${iframeSrc}`;

        // Step 3: Fetch the iframe content
        const iframeResponse = await axios.get(iframeUrl);
        const iframeHtml = cheerio.load(iframeResponse.data);

        // Step 4: Extract the script containing the m3u8 URL
        const scriptTag = iframeHtml("script:contains('sources')").html();

        if (!scriptTag) {
            return new Response(
                JSON.stringify({ error: "Script containing sources not found." }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Step 5: Extract the m3u8 URL from the script
        const m3u8Match = scriptTag.match(/sources:\s*\[\{file:\"(.*?\.m3u8)\"/);

        if (!m3u8Match || !m3u8Match[1]) {
            return new Response(
                JSON.stringify({ error: "m3u8 URL not found in the script." }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const m3u8Url = m3u8Match[1].replace(/\\/g, "");

        return new Response(m3u8Url, {
            headers: { "Content-Type": "text/plain" }
        });
    } catch (error) {
        console.error("Error in processing the request:", error);
        return new Response(
            JSON.stringify({ error: "Failed to process the request." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}