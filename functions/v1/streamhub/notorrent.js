import axios from "axios";

function validateApiKey(apiKey, env) {
  return (env.API_KEYS || "").split(",").map(k => k.trim()).includes(apiKey);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const API_BASE = env.STREAMHUB_BASE_URL;
    const url = new URL(request.url);
    const apiKey = url.searchParams.get("api_key");
    const tmdbId = url.searchParams.get("tmdb_id");
    if (!apiKey || !validateApiKey(apiKey, env)) return new Response(JSON.stringify({ success: false, message: "Invalid API key" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    if (!tmdbId) return new Response(JSON.stringify({ success: false, message: "Missing tmdb_id" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    const { data } = await axios.get(`${API_BASE}/streams/notorrent/movie/${tmdbId}`, { timeout: 15000 });
    return new Response(JSON.stringify(data), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "Upstream unreachable" }), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
