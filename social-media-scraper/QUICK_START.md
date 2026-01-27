# Quick Start Guide

## Instalasi

```bash
cd social-media-scraper
npm install
```

## Penggunaan Cepat

### YouTube
```bash
# Info video
npm start youtube video "https://www.youtube.com/watch?v=VIDEO_ID"

# Search
npm start youtube search "keyword" -- -l 5

# Info channel
npm start youtube channel "@channelname"
```

### TikTok
```bash
# Info video
npm start tiktok video "https://www.tiktok.com/@user/video/ID"

# Info user
npm start tiktok user "@username"
```

### Instagram
```bash
# Info post
npm start instagram post "https://www.instagram.com/p/POST_ID/"

# Info user
npm start instagram user "username"
```

### Twitter/X
```bash
# Info tweet
npm start twitter tweet "https://twitter.com/user/status/ID"

# Info user
npm start twitter user "@username"
```

## Save Output ke File

Tambahkan flag `-o` atau `--output`:

```bash
npm start youtube video "VIDEO_URL" -- -o hasil.json
```

## Lihat Help

```bash
npm start -- --help
npm start youtube --help
npm start tiktok --help
```

## Struktur Output JSON

Semua output memiliki format standar:
```json
{
  "platform": "youtube|tiktok|instagram|twitter",
  "type": "video|user|channel|post|tweet|search",
  "url": "original_url",
  "data": {
    // Data spesifik platform
  },
  "scrapedAt": "2026-01-27T00:00:00.000Z"
}
```

## Troubleshooting

1. **Rate Limiting**: Tunggu beberapa saat sebelum request berikutnya
2. **Data tidak lengkap**: Beberapa platform membatasi akses tanpa authentication
3. **Error parsing**: Platform mungkin mengubah struktur HTML, perlu update scraper

Untuk contoh lebih lengkap, lihat `EXAMPLES.md`
