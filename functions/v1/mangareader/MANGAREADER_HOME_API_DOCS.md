# MangaReader Home API Documentation

## Overview
The MangaReader Home API provides comprehensive manga data from mangareader.to homepage including hot updates, trending, recommended, latest updates, most viewed, and completed sections.

## Endpoint
**GET/POST** `/v1/mangareader/home`

## Authentication
- **GET**: `?api_key=YOUR_API_KEY`
- **POST**: Send JSON body with `api_key` field

```json
{
  "api_key": "YOUR_API_KEY"
}
```

## Response Schema

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "hot_updates": [...],
    "trending": [...],
    "recommended": [...],
    "latest_updates": {...},
    "most_viewed": {...},
    "completed": [...]
  }
}
```

---

## Section Details

### 1. Hot Updates
**Description**: Featured carousel with latest hot manga releases

**Response Example**:
```json
{
  "hot_updates": [
    {
      "id": "manga-title-slug",
      "title": "Manga Title",
      "link": "/manga-title-slug",
      "image": "https://img.mreadercdn.com/.../image.jpg",
      "chapter": "Chapter 50",
      "language": "EN",
      "description": "Description of the manga...",
      "genres": ["Action", "Adventure", "Fantasy"],
      "read_link": "/read/manga-title-slug/en/chapter-50",
      "info_link": "/manga-title-slug"
    }
  ]
}
```

**Fields**:
- `id` (string): Manga slug/identifier
- `title` (string): Manga title
- `link` (string): Link to manga info page
- `image` (string): URL to manga cover image
- `chapter` (string): Latest chapter info
- `language` (string): Language code (e.g., "EN", "JA")
- `description` (string): Short manga description
- `genres` (array): List of genre strings
- `read_link` (string): Direct link to read latest chapter
- `info_link` (string): Link to manga details page

---

### 2. Trending
**Description**: Top ranked manga by popularity/views

**Response Example**:
```json
{
  "trending": [
    {
      "rank": "01",
      "id": "one-piece",
      "title": "One Piece",
      "link": "/one-piece",
      "image": "https://img.mreadercdn.com/.../image.jpg",
      "rating": "8.5",
      "languages": "EN/ES-MX/FR/JA/PT-BR",
      "chapter": "Chap 1163 [EN]",
      "chapter_link": "/read/one-piece/en/chapter-1163",
      "volume": "Vol 107 [EN]",
      "volume_link": "/read/one-piece/en/volume-107",
      "read_link": "/read/one-piece",
      "info_link": "/one-piece"
    }
  ]
}
```

**Fields**:
- `rank` (string): Ranking number (01-10 typically)
- `id` (string): Manga slug/identifier
- `title` (string): Manga title
- `link` (string): Link to manga info page
- `image` (string): URL to manga cover image
- `rating` (string): Rating score or empty
- `languages` (string): Available languages (comma-separated)
- `chapter` (string): Latest chapter text
- `chapter_link` (string): Link to latest chapter
- `volume` (string): Latest volume text
- `volume_link` (string): Link to latest volume
- `read_link` (string): Direct read link
- `info_link` (string): Info page link

---

### 3. Recommended
**Description**: Featured recommended manga carousel

**Response Example**:
```json
{
  "recommended": [
    {
      "id": "manga-slug",
      "title": "Manga Title",
      "link": "/manga-slug",
      "image": "https://img.mreadercdn.com/.../image.jpg",
      "rating": "7.5",
      "languages": "EN/JA",
      "genres": ["Comedy", "Romance", "School"],
      "chapter": "Chap 100 [EN]",
      "chapter_link": "/read/manga-slug/en/chapter-100",
      "volume": "Vol 5 [EN]",
      "volume_link": "/read/manga-slug/en/volume-5",
      "read_link": "/read/manga-slug",
      "info_link": "/manga-slug"
    }
  ]
}
```

**Fields**: Same as Trending + genres array

---

### 4. Latest Updates
**Description**: Latest chapter and volume releases with tabs

**Response Example**:
```json
{
  "latest_updates": {
    "chapters": [
      {
        "id": "insanely-talented-player",
        "title": "Insanely-Talented Player",
        "link": "/insanely-talented-player",
        "image": "https://img.mreadercdn.com/.../image.jpg",
        "languages": "EN",
        "genres": ["Action", "Drama", "Fantasy"],
        "chapters": [
          {
            "name": "Chap 98 [EN]",
            "link": "/read/insanely-talented-player/en/chapter-98"
          },
          {
            "name": "Chap 97 [EN]",
            "link": "/read/insanely-talented-player/en/chapter-97"
          },
          {
            "name": "Chap 96 [EN]",
            "link": "/read/insanely-talented-player/en/chapter-96"
          }
        ]
      }
    ],
    "volumes": [
      {
        "id": "goddess-cafe-terrace",
        "title": "Goddess Café Terrace",
        "link": "/goddess-cafe-terrace",
        "image": "https://img.mreadercdn.com/.../image.jpg",
        "languages": "EN/JA",
        "genres": ["Comedy", "Ecchi", "Harem"],
        "volumes": [
          {
            "name": "Vol 15 [EN]",
            "link": "/read/goddess-cafe-terrace/en/volume-15"
          },
          {
            "name": "Vol 14 [EN]",
            "link": "/read/goddess-cafe-terrace/en/volume-14"
          }
        ]
      }
    ]
  }
}
```

**Fields**:
- `chapters` (array): Latest chapters list
- `volumes` (array): Latest volumes list
- Each item has `id`, `title`, `link`, `image`, `languages`, `genres`
- `chapters`/`volumes` array contains `name` and `link`

---

### 5. Most Viewed
**Description**: Top viewed manga by timeframe (Today, Week, Month)

**Response Example**:
```json
{
  "most_viewed": {
    "today": [
      {
        "rank": "01",
        "id": "one-piece",
        "title": "One Piece",
        "link": "/one-piece",
        "image": "https://img.mreadercdn.com/.../image.jpg",
        "languages": "EN/ES-MX/FR/JA/PT-BR",
        "views": "289",
        "genres": ["Action", "Adventure"],
        "chapter": "Chap 1163",
        "volume": "Vol 107"
      }
    ],
    "week": [
      {
        "rank": "01",
        "id": "one-piece",
        "title": "One Piece",
        "link": "/one-piece",
        "image": "https://img.mreadercdn.com/.../image.jpg",
        "languages": "EN/ES-MX/FR/JA/PT-BR",
        "views": "11,754",
        "genres": ["Action", "Adventure"],
        "chapter": "Chap 1163",
        "volume": "Vol 107"
      }
    ],
    "month": [
      {
        "rank": "01",
        "id": "one-piece",
        "title": "One Piece",
        "link": "/one-piece",
        "image": "https://img.mreadercdn.com/.../image.jpg",
        "languages": "EN/ES-MX/FR/JA/PT-BR",
        "views": "44,019",
        "genres": ["Action", "Adventure"],
        "chapter": "Chap 1163",
        "volume": "Vol 107"
      }
    ]
  }
}
```

**Fields**:
- `today` (array): Top viewed today
- `week` (array): Top viewed this week
- `month` (array): Top viewed this month
- Each item includes: `rank`, `id`, `title`, `link`, `image`, `languages`, `views`, `genres`, `chapter`, `volume`

---

### 6. Completed
**Description**: Completed manga carousel

**Response Example**:
```json
{
  "completed": [
    {
      "id": "komi-cant-communicate",
      "title": "Komi Can't Communicate",
      "link": "/komi-cant-communicate",
      "image": "https://img.mreadercdn.com/.../image.jpg",
      "rating": "8.28",
      "languages": "EN/FR/JA/PT-BR",
      "genres": ["Comedy", "School"],
      "chapter": "Chap 500 [EN]",
      "chapter_link": "/read/komi-cant-communicate/en/chapter-500",
      "volume": "Vol 31 [EN]",
      "volume_link": "/read/komi-cant-communicate/en/volume-31",
      "read_link": "/read/komi-cant-communicate",
      "info_link": "/komi-cant-communicate"
    }
  ]
}
```

**Fields**: Same as Recommended

---

## Error Response (401 Unauthorized)
```json
{
  "success": false,
  "message": "Invalid or missing API key.",
  "protip": "Missing API key? Join our Discord and claim yours—it's free! 👉 https://discord.gg/cwDTVKyKJz"
}
```

## Error Response (500 Server Error)
```json
{
  "success": false,
  "error": "Failed to fetch mangareader home data.",
  "details": "Error message details..."
}
```

---

## Usage Examples

### JavaScript/Fetch
```javascript
// GET Request
fetch('/v1/mangareader/home?api_key=YOUR_API_KEY')
  .then(res => res.json())
  .then(data => {
    console.log(data.data.hot_updates);
    console.log(data.data.trending);
    console.log(data.data.latest_updates.chapters);
    console.log(data.data.most_viewed.today);
  });

// POST Request
fetch('/v1/mangareader/home', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ api_key: 'YOUR_API_KEY' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### React Example
```jsx
import { useState, useEffect } from 'react';

export function MangaHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/v1/mangareader/home?api_key=YOUR_API_KEY')
      .then(res => res.json())
      .then(data => {
        setData(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <section>
        <h2>Hot Updates</h2>
        {data.hot_updates.map(manga => (
          <div key={manga.id}>
            <img src={manga.image} alt={manga.title} />
            <h3>{manga.title}</h3>
            <p>{manga.chapter} - {manga.language}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Trending</h2>
        {data.trending.map(manga => (
          <div key={manga.id}>
            <span>#{manga.rank}</span>
            <h3>{manga.title}</h3>
            <p>Rating: {manga.rating} ⭐</p>
            <p>{manga.views} views</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Most Viewed Today</h2>
        {data.most_viewed.today.map(manga => (
          <div key={manga.id}>
            <h3>{manga.title}</h3>
            <p>{manga.views} views</p>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## Notes
- All image URLs are from `img.mreadercdn.com`
- Language codes: EN, JA, FR, ES-MX, PT-BR, KO, etc.
- Rating may be empty ("") if not available
- Chapter/volume links are relative to mangareader.to
- Genres are extracted from the page and cleaned

---

## HTTP Headers Used
- User-Agent: Chrome 141
- Referer: https://mangareader.to/
- Origin: https://mangareader.to
- Sec-Ch-Ua: Chrome fingerprint headers
- Accept-Encoding: gzip, deflate, br

