import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Twitter/X Scraper
 * Mengambil informasi dari Twitter/X tweets dan users (public data only)
 */

export class TwitterScraper {
  constructor() {
    this.baseUrl = 'https://twitter.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    };
  }

  /**
   * Ekstrak tweet ID dari URL
   */
  extractTweetId(url) {
    const patterns = [
      /twitter\.com\/[\w]+\/status\/(\d+)/,
      /x\.com\/[\w]+\/status\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Jika sudah tweet ID langsung
    if (/^\d+$/.test(url)) {
      return url;
    }

    throw new Error('Invalid Twitter/X URL or Tweet ID');
  }

  /**
   * Ekstrak username dari URL
   */
  extractUsername(url) {
    const patterns = [
      /twitter\.com\/([\w]+)/,
      /x\.com\/([\w]+)/,
      /@([\w]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Jika sudah username langsung
    if (!url.includes('/') && !url.includes('@')) {
      return url;
    }

    throw new Error('Invalid Twitter/X username or URL');
  }

  /**
   * Ambil informasi tweet
   */
  async getTweetInfo(url) {
    try {
      const tweetId = this.extractTweetId(url);
      
      // Normalize URL (support both twitter.com and x.com)
      let tweetUrl = url;
      if (!url.startsWith('http')) {
        tweetUrl = `https://twitter.com/i/status/${tweetId}`;
      }

      const response = await axios.get(tweetUrl, {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      
      // Extract dari meta tags
      const metaData = {
        title: $('meta[property="og:title"]').attr('content') || 
               $('meta[name="twitter:title"]').attr('content') || 'N/A',
        description: $('meta[property="og:description"]').attr('content') || 
                    $('meta[name="twitter:description"]').attr('content') || 'N/A',
        image: $('meta[property="og:image"]').attr('content') || 
               $('meta[name="twitter:image"]').attr('content') || null,
        creator: $('meta[name="twitter:creator"]').attr('content') || 'N/A',
        site: $('meta[name="twitter:site"]').attr('content') || 'N/A'
      };

      const result = {
        platform: 'twitter',
        type: 'tweet',
        url: tweetUrl,
        tweetId: tweetId,
        data: {
          text: metaData.description,
          author: {
            username: metaData.creator?.replace('@', '') || 'N/A',
            name: metaData.title?.split(' on X:')[0] || 'N/A',
            verified: false
          },
          media: metaData.image ? [{
            type: 'photo',
            url: metaData.image
          }] : [],
          stats: {
            retweets: 'N/A',
            likes: 'N/A',
            replies: 'N/A',
            views: 'N/A'
          },
          timestamp: 'N/A',
          hashtags: this.extractHashtags(metaData.description),
          mentions: this.extractMentions(metaData.description)
        },
        scrapedAt: new Date().toISOString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to get Twitter/X tweet info: ${error.message}`);
    }
  }

  /**
   * Ambil informasi user Twitter
   */
  async getUserInfo(username) {
    try {
      const cleanUsername = this.extractUsername(username);
      const userUrl = `https://twitter.com/${cleanUsername}`;

      const response = await axios.get(userUrl, {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      
      // Extract dari meta tags
      const metaData = {
        title: $('meta[property="og:title"]').attr('content') || 'N/A',
        description: $('meta[property="og:description"]').attr('content') || 'N/A',
        image: $('meta[property="og:image"]').attr('content') || null
      };

      const result = {
        platform: 'twitter',
        type: 'user',
        url: userUrl,
        data: {
          username: cleanUsername,
          name: metaData.title?.split(' (@')[0] || 'N/A',
          bio: metaData.description,
          profileImage: metaData.image,
          stats: {
            followers: 'N/A',
            following: 'N/A',
            tweets: 'N/A'
          },
          verified: false,
          protected: false
        },
        scrapedAt: new Date().toISOString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to get Twitter/X user info: ${error.message}`);
    }
  }

  /**
   * Extract hashtags dari text
   */
  extractHashtags(text) {
    if (!text) return [];
    const matches = text.match(/#[\w]+/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Extract mentions dari text
   */
  extractMentions(text) {
    if (!text) return [];
    const matches = text.match(/@[\w]+/g);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  }

  /**
   * Get trending topics (simplified - requires scraping trending page)
   */
  async getTrending() {
    try {
      const trendingUrl = 'https://twitter.com/explore/tabs/trending';
      
      const response = await axios.get(trendingUrl, {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      
      const trends = [];
      
      // Note: Twitter's trending requires authentication for full data
      // This is a simplified version that may not work without auth
      
      return {
        platform: 'twitter',
        type: 'trending',
        trends: trends,
        count: trends.length,
        note: 'Twitter trending requires authentication for full access',
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get Twitter/X trending: ${error.message}`);
    }
  }
}

export default TwitterScraper;
