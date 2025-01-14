import * as cheerio from "cheerio";

export async function onRequestGet({ request }) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get("videoUrl");

  if (!videoUrl) {
    return new Response(
      JSON.stringify({ error: "Missing videoUrl parameter" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    const headers = {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    };

    let html = await fetchAndFollowRedirects(videoUrl, headers);
    if (!html) {
      return new Response(
        JSON.stringify({ error: "Unable to fetch the final page" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Extract specific download links from the final HTML
    const downloadLinks = extractDownloadLinks(html);

    return new Response(JSON.stringify({downloadLinks }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

async function fetchAndFollowRedirects(url, headers) {
  try {
    let response = await fetch(url, { headers });

    if (!response.ok) {
      return null;
    }

    let html = await response.text();
    let $ = cheerio.load(html);

    // Handle meta-refresh redirection
    const metaRedirect = $('meta[http-equiv="refresh"]').attr("content");
    if (metaRedirect) {
      const redirectUrl = metaRedirect.split("url=")[1];
      if (redirectUrl) {
        return await fetchAndFollowRedirects(redirectUrl, headers);
      }
    }

    // Handle JavaScript-based redirection
    const jsRedirect = $('body').attr("onload");
    if (jsRedirect && jsRedirect.includes("location.replace")) {
      const jsUrlMatch = jsRedirect.match(/location\.replace\('([^']+)'\)/);
      if (jsUrlMatch && jsUrlMatch[1]) {
        return await fetchAndFollowRedirects(jsUrlMatch[1], headers);
      }
    }

    // Extract href from the target <a> tag (e.g., .vd a.btn)
    const targetHref = $(".vd a.btn").attr("href");
    if (targetHref) {
      return await fetchAndFollowRedirects(targetHref, headers);
    }

    return html; // Return the final HTML if no more redirection is detected
  } catch (error) {
    console.error("Error during fetch and follow redirects:", error);
    return null;
  }
}

function extractDownloadLinks(html) {
  const $ = cheerio.load(html);

  const links = {};

  // Extract the first green download button
  const greenButton = $("a.btn-success.btn-lg.h6").first();
  if (greenButton.length) {
    links.greenDownloadButton = greenButton.attr("href") || null;
  }

  // Extract the second red download button
  const redButton = $("a.btn-danger.btn-lg.h6").first();
  if (redButton.length) {
    links.redDownloadButton = redButton.attr("href") || null;
  }

  return links;
}
