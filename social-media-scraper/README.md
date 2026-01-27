# Social Media Scraper

Aplikasi Node.js untuk mengambil data informasi dari berbagai platform sosial media seperti YouTube, TikTok, Instagram, Twitter, dan lainnya.

## Fitur

- ✅ **YouTube**: Ambil informasi video, channel, statistik, dan komentar
- ✅ **TikTok**: Ambil informasi video dan user
- ✅ **Instagram**: Ambil informasi post dan user (public data)
- ✅ **Twitter/X**: Ambil informasi tweets dan user
- ✅ **Facebook**: Ambil informasi public posts

## Instalasi

```bash
cd social-media-scraper
npm install
```

## Cara Penggunaan

### YouTube

```bash
# Ambil info video
npm start youtube video https://www.youtube.com/watch?v=VIDEO_ID

# Ambil info channel
npm start youtube channel https://www.youtube.com/channel/CHANNEL_ID

# Ambil info dengan output file
npm start youtube video https://www.youtube.com/watch?v=VIDEO_ID --output result.json
```

### TikTok

```bash
# Ambil info video
npm start tiktok video https://www.tiktok.com/@username/video/VIDEO_ID

# Ambil info user
npm start tiktok user @username
```

### Instagram

```bash
# Ambil info post
npm start instagram post https://www.instagram.com/p/POST_ID/

# Ambil info user
npm start instagram user username
```

### Twitter/X

```bash
# Ambil info tweet
npm start twitter tweet https://twitter.com/username/status/TWEET_ID

# Ambil info user
npm start twitter user @username
```

## Output

Semua hasil akan disimpan dalam format JSON. Jika tidak menentukan file output, hasil akan ditampilkan di console.

## Contoh Output

### YouTube Video Info
```json
{
  "platform": "youtube",
  "type": "video",
  "data": {
    "title": "Video Title",
    "author": "Channel Name",
    "views": 1000000,
    "likes": 50000,
    "description": "Video description...",
    "duration": "10:30",
    "uploadDate": "2024-01-01"
  }
}
```

## Catatan

- Beberapa platform mungkin memerlukan API key atau authentication
- Rate limiting diterapkan untuk menghindari blocking
- Hanya data public yang dapat diakses
- Gunakan dengan bijak dan patuhi Terms of Service masing-masing platform

## License

MIT
