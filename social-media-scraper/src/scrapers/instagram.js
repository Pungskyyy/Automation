import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Instagram Scraper
 * Mengambil informasi dari Instagram posts dan users (public data only)
 */

export class InstagramScraper {
  constructor() {
    this.baseUrl = 'https://www.instagram.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    };
  }

  /**
   * Ekstrak post shortcode dari URL
   */
  extractPostId(url) {
    const patterns = [
      /instagram\.com\/p\/([\w-]+)/,
      /instagram\.com\/reel\/([\w-]+)/,
      /instagram\.com\/tv\/([\w-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Jika sudah shortcode langsung
    if (!url.includes('/') && /^[\w-]+$/.test(url)) {
      return url;
    }

    throw new Error('Invalid Instagram post URL or shortcode');
  }

  /**
   * Ekstrak username dari URL
   */
  extractUsername(url) {
    const patterns = [
      /instagram\.com\/([\w.]+)\/?$/,
      /instagram\.com\/([\w.]+)\/$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && !['p', 'reel', 'tv', 'explore'].includes(match[1])) {
        return match[1];
      }
    }

    // Jika sudah username langsung
    if (!url.includes('/')) {
      return url;
    }

    throw new Error('Invalid Instagram username or URL');
  }

  /**
   * Parse shared data dari halaman Instagram
   */
  parseSharedData(html) {
    const $ = cheerio.load(html);
    
    let sharedData = null;
    
    // Cari window._sharedData
    $('script').each((i, elem) => {
      const content = $(elem).html();
      if (content && content.includes('window._sharedData')) {
        try {
          const jsonStr = content.match(/window\._sharedData\s*=\s*({.*?});/s);
          if (jsonStr && jsonStr[1]) {
            sharedData = JSON.parse(jsonStr[1]);
          }
        } catch (e) {
          // Ignore
        }
      }
    });

    return sharedData;
  }

  /**
   * Ambil informasi post Instagram
   */
  async getPostInfo(url) {
    try {
      const shortcode = this.extractPostId(url);
      const postUrl = `https://www.instagram.com/p/${shortcode}/`;

      const response = await axios.get(postUrl, {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      
      // Fallback meta tags
      const metaData = {
        title: $('meta[property="og:title"]').attr('content') || 'N/A',
        description: $('meta[property="og:description"]').attr('content') || 'N/A',
        image: $('meta[property="og:image"]').attr('content') || null,
        type: $('meta[property="og:type"]').attr('content') || 'N/A'
      };

      // Try to get JSON data
      let postData = null;
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const json = JSON.parse($(elem).html());
          if (json['@type'] === 'ImageObject' || json['@type'] === 'VideoObject') {
            postData = json;
          }
        } catch (e) {
          // Ignore
        }
      });

      const result = {
        platform: 'instagram',
        type: 'post',
        url: postUrl,
        shortcode: shortcode,
        data: {
          caption: metaData.description,
          image: metaData.image,
          type: metaData.type,
          author: {
            username: 'N/A',
            name: 'N/A'
          },
          stats: {
            likes: 'N/A',
            comments: 'N/A'
          },
          timestamp: 'N/A'
        },
        scrapedAt: new Date().toISOString()
      };

      // Parse dari JSON-LD jika ada
      if (postData) {
        result.data = {
          ...result.data,
          caption: postData.caption || metaData.description,
          image: postData.image || postData.contentUrl || metaData.image,
          author: {
            username: postData.author?.identifier?.value || postData.author?.alternateName || 'N/A',
            name: postData.author?.name || 'N/A',
            url: postData.author?.url || null
          },
          stats: {
            likes: postData.interactionStatistic?.find(s => s.interactionType === 'http://schema.org/LikeAction')?.userInteractionCount || 'N/A',
            comments: postData.interactionStatistic?.find(s => s.interactionType === 'http://schema.org/CommentAction')?.userInteractionCount || 'N/A'
          },
          timestamp: postData.uploadDate || 'N/A'
        };
      }

      // Try shared data
      const sharedData = this.parseSharedData(response.data);
      if (sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media) {
        const media = sharedData.entry_data.PostPage[0].graphql.shortcode_media;
        
        result.data = {
          caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || metaData.description,
          image: media.display_url || metaData.image,
          type: media.__typename || metaData.type,
          isVideo: media.is_video || false,
          author: {
            username: media.owner?.username || 'N/A',
            name: media.owner?.full_name || 'N/A',
            profilePic: media.owner?.profile_pic_url || null,
            verified: media.owner?.is_verified || false
          },
          stats: {
            likes: media.edge_media_preview_like?.count || 'N/A',
            comments: media.edge_media_to_comment?.count || 'N/A',
            views: media.video_view_count || null
          },
          timestamp: media.taken_at_timestamp ? new Date(media.taken_at_timestamp * 1000).toISOString() : 'N/A',
          location: media.location?.name || null,
          hashtags: this.extractHashtags(media.edge_media_to_caption?.edges?.[0]?.node?.text || '')
        };
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get Instagram post info: ${error.message}`);
    }
  }

  /**
   * Ambil informasi user Instagram
   */
  async getUserInfo(username) {
    try {
      const cleanUsername = this.extractUsername(username);
      const userUrl = `https://www.instagram.com/${cleanUsername}/`;

      const response = await axios.get(userUrl, {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      
      // Meta tags fallback
      const metaData = {
        title: $('meta[property="og:title"]').attr('content') || 'N/A',
        description: $('meta[property="og:description"]').attr('content') || 'N/A',
        image: $('meta[property="og:image"]').attr('content') || null
      };

      const result = {
        platform: 'instagram',
        type: 'user',
        url: userUrl,
        data: {
          username: cleanUsername,
          fullName: metaData.title,
          bio: metaData.description,
          profilePic: metaData.image,
          stats: {
            followers: 'N/A',
            following: 'N/A',
            posts: 'N/A'
          },
          verified: false,
          private: false
        },
        scrapedAt: new Date().toISOString()
      };

      // Try shared data
      const sharedData = this.parseSharedData(response.data);
      if (sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user) {
        const user = sharedData.entry_data.ProfilePage[0].graphql.user;
        
        result.data = {
          username: user.username || cleanUsername,
          fullName: user.full_name || metaData.title,
          bio: user.biography || metaData.description,
          profilePic: user.profile_pic_url_hd || user.profile_pic_url || metaData.image,
          stats: {
            followers: user.edge_followed_by?.count || 'N/A',
            following: user.edge_follow?.count || 'N/A',
            posts: user.edge_owner_to_timeline_media?.count || 'N/A'
          },
          verified: user.is_verified || false,
          private: user.is_private || false,
          businessAccount: user.is_business_account || false,
          externalUrl: user.external_url || null,
          category: user.category_name || null
        };
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get Instagram user info: ${error.message}`);
    }
  }

  /**
   * Extract hashtags dari caption
   */
  extractHashtags(text) {
    if (!text) return [];
    const matches = text.match(/#[\w]+/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Get user's recent posts (limited without auth)
   */
  async getUserPosts(username, limit = 12) {
    try {
      const cleanUsername = this.extractUsername(username);
      const userUrl = `https://www.instagram.com/${cleanUsername}/`;

      const response = await axios.get(userUrl, {
        headers: this.headers
      });

      const sharedData = this.parseSharedData(response.data);
      const posts = [];

      if (sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges) {
        const edges = sharedData.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges;
        
        for (const edge of edges.slice(0, limit)) {
          const node = edge.node;
          posts.push({
            shortcode: node.shortcode,
            url: `https://www.instagram.com/p/${node.shortcode}/`,
            thumbnail: node.thumbnail_src || node.display_url,
            isVideo: node.is_video,
            caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
            likes: node.edge_liked_by?.count || 0,
            comments: node.edge_media_to_comment?.count || 0,
            timestamp: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : null
          });
        }
      }

      return {
        platform: 'instagram',
        type: 'user_posts',
        username: cleanUsername,
        posts: posts,
        count: posts.length,
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get Instagram user posts: ${error.message}`);
    }
  }
}

export default InstagramScraper;
