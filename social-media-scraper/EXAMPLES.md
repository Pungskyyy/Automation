# Contoh Penggunaan Social Media Scraper

## YouTube

### 1. Ambil Info Video
```bash
npm start youtube video "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

Output:
- Title video
- Author/Channel info
- Views, Likes
- Duration
- Description
- Upload date

### 2. Ambil Info Channel
```bash
npm start youtube channel "https://www.youtube.com/@RickAstley"
# atau
npm start youtube channel "@RickAstley"
```

### 3. Search Video
```bash
npm start youtube search "nodejs tutorial" -- -l 5
```

### 4. Save ke File JSON
```bash
npm start youtube video "dQw4w9WgXcQ" -- -o hasil_youtube.json
```

## TikTok

### 1. Ambil Info Video
```bash
npm start tiktok video "https://www.tiktok.com/@username/video/1234567890"
```

### 2. Ambil Info User
```bash
npm start tiktok user "@username"
# atau
npm start tiktok user "username"
```

### 3. Trending Hashtags
```bash
npm start tiktok trending
```

## Instagram

### 1. Ambil Info Post
```bash
npm start instagram post "https://www.instagram.com/p/ABC123/"
```

### 2. Ambil Info User
```bash
npm start instagram user "username"
```

### 3. Ambil Posts dari User
```bash
npm start instagram user-posts "username" -- -l 10
```

## Twitter/X

### 1. Ambil Info Tweet
```bash
npm start twitter tweet "https://twitter.com/username/status/1234567890"
```

### 2. Ambil Info User
```bash
npm start twitter user "@username"
# atau
npm start twitter user "username"
```

### 3. Trending Topics
```bash
npm start twitter trending
```

## Tips

1. **Gunakan quotes** untuk URL yang mengandung special characters
2. **Save output** dengan flag `-o` atau `--output`
3. **Limit results** untuk search dengan flag `-l` atau `--limit`
4. **Video ID saja** juga bisa digunakan untuk YouTube

## Catatan Penting

- Beberapa platform memiliki rate limiting
- Data yang diambil hanya data public
- Instagram dan Twitter mungkin memerlukan authentication untuk data lengkap
- TikTok sering mengubah struktur HTML, scraper mungkin perlu update
- Gunakan dengan bijak dan patuhi Terms of Service masing-masing platform
