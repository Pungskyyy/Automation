import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * YouTube Scraper
 * Mengambil informasi dari YouTube videos dan channels
 */

export class YouTubeScraper {
  constructor() {
    this.baseUrl = 'https://www.youtube.com';
  }

  /**
   * Ekstrak video ID dari URL YouTube
   */
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Jika sudah video ID langsung
    if (url.length === 11 && !url.includes('/')) {
      return url;
    }

    throw new Error('Invalid YouTube URL or Video ID');
  }

  /**
   * Ekstrak channel ID atau username dari URL
   */
  extractChannelId(url) {
    const patterns = [
      /youtube\.com\/channel\/([^\/\n?#]+)/,
      /youtube\.com\/c\/([^\/\n?#]+)/,
      /youtube\.com\/@([^\/\n?#]+)/,
      /youtube\.com\/user\/([^\/\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Jika sudah channel ID/username langsung
    if (!url.includes('/')) {
      return url;
    }

    throw new Error('Invalid YouTube Channel URL');
  }

  /**
   * Format durasi dari detik ke format HH:MM:SS
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format angka besar (views, likes, dll)
   */
  formatNumber(num) {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Ambil informasi video YouTube
   */
  async getVideoInfo(url) {
    try {
      const videoId = this.extractVideoId(url);
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Gunakan ytdl-core untuk mendapatkan info video
      const info = await ytdl.getInfo(videoUrl);
      const details = info.videoDetails;

      const result = {
        platform: 'youtube',
        type: 'video',
        url: videoUrl,
        videoId: videoId,
        data: {
          title: details.title,
          description: details.description,
          author: {
            name: details.author.name,
            channelId: details.author.id,
            channelUrl: details.author.channel_url,
            verified: details.author.verified || false,
            subscriberCount: details.author.subscriber_count || 'N/A'
          },
          duration: {
            seconds: parseInt(details.lengthSeconds),
            formatted: this.formatDuration(parseInt(details.lengthSeconds))
          },
          views: {
            count: parseInt(details.viewCount),
            formatted: this.formatNumber(parseInt(details.viewCount))
          },
          likes: details.likes ? {
            count: parseInt(details.likes),
            formatted: this.formatNumber(parseInt(details.likes))
          } : null,
          uploadDate: details.uploadDate || 'N/A',
          publishDate: details.publishDate || 'N/A',
          category: details.category || 'N/A',
          isLiveContent: details.isLiveContent || false,
          isPrivate: details.isPrivate || false,
          thumbnails: details.thumbnails || [],
          keywords: details.keywords || [],
          averageRating: details.averageRating || null,
          ageRestricted: details.age_restricted || false
        },
        formats: {
          total: info.formats.length,
          videoFormats: info.formats.filter(f => f.hasVideo && f.hasAudio).length,
          audioFormats: info.formats.filter(f => f.hasAudio && !f.hasVideo).length
        },
        scrapedAt: new Date().toISOString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to get YouTube video info: ${error.message}`);
    }
  }

  /**
   * Ambil informasi channel YouTube (basic scraping)
   */
  async getChannelInfo(url) {
    try {
      const channelId = this.extractChannelId(url);
      let channelUrl = url;
      
      if (!url.startsWith('http')) {
        // Coba berbagai format URL
        if (channelId.startsWith('@')) {
          channelUrl = `https://www.youtube.com/${channelId}`;
        } else if (channelId.startsWith('UC')) {
          channelUrl = `https://www.youtube.com/channel/${channelId}`;
        } else {
          channelUrl = `https://www.youtube.com/@${channelId}`;
        }
      }

      // Scrape halaman channel
      const response = await axios.get(channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract data dari script tags (YouTube menyimpan data di JSON)
      let channelData = null;
      $('script').each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes('var ytInitialData')) {
          try {
            const jsonStr = content.match(/var ytInitialData = ({.*?});/s);
            if (jsonStr && jsonStr[1]) {
              channelData = JSON.parse(jsonStr[1]);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      });

      const result = {
        platform: 'youtube',
        type: 'channel',
        url: channelUrl,
        data: {
          channelId: channelId,
          name: $('meta[property="og:title"]').attr('content') || 'N/A',
          description: $('meta[property="og:description"]').attr('content') || 'N/A',
          thumbnail: $('meta[property="og:image"]').attr('content') || null,
          url: channelUrl,
          // Data tambahan jika berhasil di-parse
          ...(channelData && this.extractChannelDataFromJson(channelData))
        },
        scrapedAt: new Date().toISOString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to get YouTube channel info: ${error.message}`);
    }
  }

  /**
   * Extract channel data dari ytInitialData JSON
   */
  extractChannelDataFromJson(data) {
    try {
      const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
      
      if (!header) return {};

      const result = {};

      // Subscriber count
      if (header.subscriberCountText?.simpleText) {
        result.subscribers = header.subscriberCountText.simpleText;
      }

      // Video count
      if (header.videosCountText?.runs?.[0]?.text) {
        result.videoCount = header.videosCountText.runs[0].text;
      }

      // Banner
      if (header.banner?.thumbnails) {
        result.banner = header.banner.thumbnails[header.banner.thumbnails.length - 1]?.url;
      }

      // Avatar
      if (header.avatar?.thumbnails) {
        result.avatar = header.avatar.thumbnails[header.avatar.thumbnails.length - 1]?.url;
      }

      return result;
    } catch (error) {
      return {};
    }
  }

  /**
   * Search YouTube videos
   */
  async searchVideos(query, limit = 10) {
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract ytInitialData
      let searchData = null;
      $('script').each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes('var ytInitialData')) {
          try {
            const jsonStr = content.match(/var ytInitialData = ({.*?});/s);
            if (jsonStr && jsonStr[1]) {
              searchData = JSON.parse(jsonStr[1]);
            }
          } catch (e) {
            // Ignore
          }
        }
      });

      const videos = [];
      
      if (searchData) {
        const contents = searchData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
        
        for (const item of contents) {
          if (videos.length >= limit) break;
          
          const videoRenderer = item.videoRenderer;
          if (videoRenderer) {
            videos.push({
              videoId: videoRenderer.videoId,
              title: videoRenderer.title?.runs?.[0]?.text || 'N/A',
              url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`,
              thumbnail: videoRenderer.thumbnail?.thumbnails?.[0]?.url || null,
              duration: videoRenderer.lengthText?.simpleText || 'N/A',
              views: videoRenderer.viewCountText?.simpleText || 'N/A',
              publishedTime: videoRenderer.publishedTimeText?.simpleText || 'N/A',
              channel: {
                name: videoRenderer.ownerText?.runs?.[0]?.text || 'N/A',
                url: videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || null
              }
            });
          }
        }
      }

      return {
        platform: 'youtube',
        type: 'search',
        query: query,
        results: videos,
        count: videos.length,
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to search YouTube: ${error.message}`);
    }
  }
}

export default YouTubeScraper;
