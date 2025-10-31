# MangaFox API - Image Proxy Solution

## Problem
Images from fanfox.net include time-limited tokens that expire. When you fetch the API and try to load images from your frontend, the tokens may have already expired or fail due to CORS/referer requirements.

## Solution
The API now includes:

1. **Proxied Image URLs** - Every image field has both:
   - `image` - Proxied through our `/v1/mangafox/image-proxy` endpoint (safe, cacheable)
   - `image_original` - Original fanfox CDN URL (for reference)

2. **Image Proxy Endpoint** - `/v1/mangafox/image-proxy`
   - Fetches images with proper fanfox headers
   - Caches for 24 hours
   - Handles token expiration automatically

## Usage

### Fetch API with Proxied Images
```bash
curl "https://your-api.com/v1/mangafox/home?api_key=your_key"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "hot_manga_releases": [
      {
        "title": "Star Martial God Technique",
        "id": "star_martial_god_technique",
        "image": "https://your-api.com/v1/mangafox/image-proxy?url=https%3A%2F%2Ffmcdn.mfcdn.net%2Fstore%2Fmanga%2F22443%2Fcover.jpg%3F...",
        "image_original": "https://fmcdn.mfcdn.net/store/manga/22443/cover.jpg?token=...",
        "chapter": "Ch.862",
        "rating": 4,
        "score": 4.69
      }
    ]
  }
}
```

## Frontend Usage

### Option 1: Use Proxied Image (Recommended)
```html
<img src="{{ manga.image }}" alt="{{ manga.title }}" />
```

### Option 2: Use Original with Referer (Advanced)
```javascript
// This requires proper CORS setup and may fail with expired tokens
fetch(manga.image_original, {
  headers: {
    'Referer': 'https://fanfox.net/'
  }
})
.then(response => response.blob())
.then(blob => {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(blob);
});
```

## Sections with Images

All these sections now have proxied images:
- `hot_manga_releases`
- `being_read_right_now`
- `featured_recommended`
- `recommended_manga`
- `new_manga_release`
- `latest_updates`

## Caching
- Images are cached for **24 hours** at the proxy endpoint
- Subsequent requests for the same image are served from cache
- No repeated token validation needed

## API Endpoints

### Main Endpoint
- **GET** `/v1/mangafox/home?api_key=YOUR_KEY`
- **POST** `/v1/mangafox/home` with `{ "api_key": "YOUR_KEY" }`

### Image Proxy Endpoint
- **GET** `/v1/mangafox/image-proxy?url=<encoded_image_url>`
- Only accepts fanfox CDN URLs (security measure)

## Performance Tips

1. **Cache the full API response** for 1-2 hours on your server
2. **Lazy load images** in your frontend to reduce bandwidth
3. **Use WebP format** where possible for smaller file sizes
4. **Prefetch critical images** for above-the-fold content

## Troubleshooting

### Images still not loading?
1. Check that your frontend can reach the proxy endpoint
2. Ensure CORS is enabled (it is by default)
3. Check browser console for specific error messages

### Images loading slowly?
1. First request may be slower (fetching from fanfox)
2. Subsequent requests use cache (much faster)
3. Consider client-side caching with Service Workers

### Proxy endpoint returns 403?
- The image URL must be from `fmcdn.mfcdn.net`
- Invalid URLs are rejected for security
