# MangaFox Manga Info API

## Endpoint: `/v1/mangafox/info`

Extract detailed information about a specific manga including metadata, chapters, and related content.

## Request Methods

### GET Request
```bash
https://your-api.com/v1/mangafox/info?api_key=YOUR_KEY&id=vigilante_boku_no_hero_academia_illegals
```

### POST Request
```bash
curl -X POST https://your-api.com/v1/mangafox/info \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_KEY",
    "id": "vigilante_boku_no_hero_academia_illegals"
  }'
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `api_key` | string | ✅ Yes | Your API key |
| `id` | string | ✅ Yes | Manga ID (slug from URL) |

## Response Example

```json
{
  "success": true,
  "data": {
    "id": "vigilante_boku_no_hero_academia_illegals",
    "title": "Vigilante: Boku no Hero Academia Illegals",
    "status": "Ongoing",
    "description": "Spin-off of Boku no Hero Academia focusing on Vigilantes (unlicensed illegal heroes).",
    "rating": 4,
    "score": 4.66,
    "cover_image": "https://your-api.com/v1/mangafox/image-proxy?url=...",
    "cover_image_original": "https://fmcdn.mfcdn.net/store/manga/21619/cover.jpg?token=...",
    "background_image": "https://your-api.com/v1/mangafox/image-proxy?url=...",
    "background_image_original": "https://fmcdn.mfcdn.net/store/manga/21619/cover.jpg?token=...",
    "authors": [
      "FURUHASHI Hideyuki"
    ],
    "genres": [
      {
        "name": "Action",
        "link": "/directory/action/"
      },
      {
        "name": "Shounen",
        "link": "/directory/shounen/"
      },
      {
        "name": "School Life",
        "link": "/directory/school-life/"
      },
      {
        "name": "Sci-fi",
        "link": "/directory/sci-fi/"
      }
    ],
    "chapter_count": 135,
    "latest_chapter": "Ch.126",
    "latest_chapter_link": "/manga/vigilante_boku_no_hero_academia_illegals/c126/1.html",
    "chapters": [
      {
        "name": "Ch.126",
        "link": "/manga/vigilante_boku_no_hero_academia_illegals/c126/1.html",
        "date": "Aug 23,2022"
      },
      {
        "name": "Ch.125",
        "link": "/manga/vigilante_boku_no_hero_academia_illegals/c125/1.html",
        "date": "May 17,2022"
      },
      {
        "name": "Ch.124",
        "link": "/manga/vigilante_boku_no_hero_academia_illegals/c124/1.html",
        "date": "Apr 25,2022"
      }
    ],
    "total_chapters_returned": 50,
    "author_other_manga": [
      {
        "title": "K - Return of Kings",
        "id": "k_return_of_kings",
        "link": "/manga/k_return_of_kings/",
        "chapter": "Ch.017"
      },
      {
        "title": "K - The First",
        "id": "k_the_first",
        "link": "/manga/k_the_first/",
        "chapter": "Ch.016"
      },
      {
        "title": "Kuroki le voleur - Kamen no Kaitou Shoujo",
        "id": "kuroki_le_voleur_kamen_no_kaitou_shoujo",
        "link": "/manga/kuroki_le_voleur_kamen_no_kaitou_shoujo/",
        "chapter": "Vol.01 Ch.001"
      }
    ]
  }
}
```

## Response Fields

### Main Fields
- **id** - Manga identifier (slug)
- **title** - Manga title
- **status** - Current status (Ongoing, Completed, etc.)
- **description** - Manga synopsis/summary
- **rating** - Star rating (0-5 scale)
- **score** - Numerical score (0.0-5.0)

### Images
- **cover_image** - Proxied cover image (use this)
- **cover_image_original** - Original fanfox CDN URL
- **background_image** - Proxied background image (use this)
- **background_image_original** - Original fanfox CDN URL

### Metadata
- **authors** - Array of author names
- **genres** - Array of genre objects with names and links
- **chapter_count** - Total number of chapters
- **latest_chapter** - Latest chapter name
- **latest_chapter_link** - Link to latest chapter

### Chapters
- **chapters** - Array of up to 50 most recent chapters
- **total_chapters_returned** - Number of chapters in response (max 50)
- **author_other_manga** - Other works by the same author

## Error Responses

### Missing ID
```json
{
  "success": false,
  "message": "Missing 'id' parameter. Please provide a manga ID.",
  "example": "?api_key=YOUR_KEY&id=vigilante_boku_no_hero_academia_illegals"
}
```

### Manga Not Found (404)
```json
{
  "success": false,
  "error": "Manga not found",
  "message": "The manga with the provided ID was not found on fanfox.net"
}
```

### Invalid API Key
```json
{
  "success": false,
  "message": "Invalid or missing API key."
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
const mangaId = "vigilante_boku_no_hero_academia_illegals";
const apiKey = "YOUR_API_KEY";

const response = await fetch(
  `https://your-api.com/v1/mangafox/info?api_key=${apiKey}&id=${mangaId}`
);
const data = await response.json();

console.log(data.data.title); // "Vigilante: Boku no Hero Academia Illegals"
console.log(data.data.chapters[0]); // Latest chapter info
```

### Python
```python
import requests

response = requests.get(
    "https://your-api.com/v1/mangafox/info",
    params={
        "api_key": "YOUR_API_KEY",
        "id": "vigilante_boku_no_hero_academia_illegals"
    }
)

manga = response.json()
print(manga['data']['title'])
print(f"Total chapters: {manga['data']['chapter_count']}")
```

### cURL
```bash
curl "https://your-api.com/v1/mangafox/info?api_key=YOUR_KEY&id=vigilante_boku_no_hero_academia_illegals"
```

## Notes

- **Chapter Limit**: Only the first 50 chapters are returned. If you need pagination, let me know.
- **Image URLs**: Always use the `cover_image` and `background_image` fields (proxied versions) in your frontend
- **Rate Limiting**: Follows your API's general rate limits
- **CORS**: Enabled for all requests
- **Caching**: Consider caching individual manga info responses for 1-2 hours

## Future Enhancements

You can extend this endpoint with:
- Pagination for chapters
- Chapter content/pages
- Comments/ratings
- Reading history
- Bookmarks
