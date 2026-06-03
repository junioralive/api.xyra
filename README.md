# api.xyra

Cloudflare Pages Functions API for drama, manga, comic, and movie scraper endpoints.

## Setup

```sh
npm install
npm run dev
```

The local server uses `wrangler.toml`. By default it exposes:

```txt
API_KEYS=key1,key2,key3
```

Most endpoints accept `api_key` through a query parameter for `GET` requests or as JSON for `POST` requests.

## Useful Commands

```sh
npm run dev      # Start Cloudflare Pages locally
npm run deploy   # Deploy the Pages project
npm run audit    # Check dependency advisories
```

## Route Layout

Cloudflare maps files under `functions/` to API routes:

```txt
functions/v1/dramacool/home.js        -> /v1/dramacool/home
functions/v1/dramacool/info.js        -> /v1/dramacool/info
functions/v1/mangareader/home.js      -> /v1/mangareader/home
functions/v1/mangafox/image-proxy.js  -> /v1/mangafox/image-proxy
```

Example local calls:

```sh
curl "http://localhost:8788/v1/dramacool/home?api_key=key1"
curl "http://localhost:8788/v1/dramacool/info?api_key=key1&id=some-drama-id"
```

## Notes

- The endpoints depend on third-party site HTML, so selectors can break when those sites change.
- Shared CORS, API key validation, and request parsing are currently duplicated across route files.
- `wrangler.toml` contains development keys only. Use Cloudflare dashboard or `wrangler secret`/Pages variables for production values.
