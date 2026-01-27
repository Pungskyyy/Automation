import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * TikTok Scraper
 * Mengambil informasi dari TikTok videos dan users
 */

export class TikTokScraper {
  constructor() {
    this.baseUrl = 'https://www.tiktok.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * Ekstrak video ID dari URL TikTok
   */
  extractVideoId(url) {
    const patterns = [
      /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
      /tiktok\.com\/v\/(\d+)/,
      /vm\.tiktok\.com\/(\w+)/,
      /vt\.tiktok\.com\/(\w+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Jika sudah video ID langsung
    if (/^\d+$/.test(url)) {
      return url;
    }

    throw new Error('Invalid TikTok URL or Video ID');
  }

  /**
   * Ekstrak username dari URL
   */
  extractUsername(url) {
    const patterns = [
      /tiktok\.com\/@([\w.-]+)/,
      /@([\w.-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Jika sudah username langsung (tanpa @)
    if (!url.includes('/') && !url.includes('@')) {
      return url;
    }

    throw new Error('Invalid TikTok username or URL');
  }

  /**
   * Format angka besar
   */
  formatNumber(num) {
    if (typeof num === 'string') {
      // Parse string seperti "1.2M", "500K"
      if (num.includes('M')) {
        return parseFloat(num) * 1000000;
      }
      if (num.includes('K')) {
        return parseFloat(num) * 1000;
      }
      if (num.includes('B')) {
        return parseFloat(num) * 1000000000;
      }
      return parseInt(num.replace(/,/g, ''));
    }
    return num;
  }

  /**
   * Ambil informasi video TikTok
   */
  async getVideoInfo(url) {
    try {
      const videoId = this.extractVideoId(url);
      let videoUrl = url;
      
      if (!url.startsWith('http')) {
        // Jika hanya ID, kita perlu URL lengkap
        // Tapi kita tidak tahu username, jadi throw error
        throw new Error('Please provide full TikTok video URL');
      }

      // Resolve short URLs jika ada
      if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
        const response = await axios.get(url, {
          maxRedirects: 5,
          headers: this.headers
        });
        videoUrl = response.request.res.responseUrl || url;
      }

      // Scrape halaman video
      const response = await axios.get(videoUrl, {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      
      // TikTok menyimpan data di __UNIVERSAL_DATA_FOR_REHYDRATION__
      let videoData = null;
      $('script').each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
          try {
            const jsonStr = content.match(/__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({.*?});/s);
            if (jsonStr && jsonStr[1]) {
              videoData = JSON.parse(jsonStr[1]);
            }
          } catch (e) {
            // Try alternative parsing
            try {
              const match = content.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/s);
              if (match && match[1]) {
                videoData = JSON.parse(match[1]);
              }
            } catch (e2) {
              // Ignore
            }
          }
        }
      });

      // Fallback: coba ambil dari meta tags
      const metaData = {
        title: $('meta[property="og:title"]').attr('content') || 
               $('meta[name="twitter:title"]').attr('content') || 'N/A',
        description: $('meta[property="og:description"]').attr('content') || 
                    $('meta[name="twitter:description"]').attr('content') || 'N/A',
        image: $('meta[property="og:image"]').attr('content') || 
               $('meta[name="twitter:image"]').attr('content') || null,
        url: $('meta[property="og:url"]').attr('content') || videoUrl
      };

      let result = {
        platform: 'tiktok',
        type: 'video',
        url: videoUrl,
        videoId: videoId,
        data: {
          title: metaData.title,
          description: metaData.description,
          thumbnail: metaData.image,
          author: {
            username: 'N/A',
            nickname: 'N/A',
            avatar: null,
            verified: false
          },
          stats: {
            views: 'N/A',
            likes: 'N/A',
            comments: 'N/A',
            shares: 'N/A',
            saves: 'N/A'
          },
          music: {
            title: 'N/A',
            author: 'N/A'
          },
          createTime: 'N/A',
          duration: 'N/A'
        },
        scrapedAt: new Date().toISOString()
      };

      // Jika berhasil parse JSON data
      if (videoData) {
        const detail = videoData?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
        
        if (detail) {
          result.data = {
            title: detail.desc || metaData.title,
            description: detail.desc || metaData.description,
            thumbnail: detail.video?.cover || detail.video?.dynamicCover || metaData.image,
            author: {
              username: detail.author?.uniqueId || 'N/A',
              nickname: detail.author?.nickname || 'N/A',
              avatar: detail.author?.avatarLarger || detail.author?.avatarMedium || null,
              verified: detail.author?.verified || false,
              signature: detail.author?.signature || ''
            },
            stats: {
              views: detail.stats?.playCount || 'N/A',
              likes: detail.stats?.diggCount || 'N/A',
              comments: detail.stats?.commentCount || 'N/A',
              shares: detail.stats?.shareCount || 'N/A',
              saves: detail.stats?.collectCount || 'N/A'
            },
            music: {
              title: detail.music?.title || 'N/A',
              author: detail.music?.authorName || 'N/A',
              duration: detail.music?.duration || 'N/A'
            },
            video: {
              duration: detail.video?.duration || 'N/A',
              ratio: detail.video?.ratio || 'N/A',
              width: detail.video?.width || 'N/A',
              height: detail.video?.height || 'N/A'
            },
            createTime: detail.createTime ? new Date(detail.createTime * 1000).toISOString() : 'N/A',
            hashtags: detail.textExtra?.filter(t => t.hashtagName).map(t => t.hashtagName) || []
          };
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get TikTok video info: ${error.message}`);
    }
  }

  /**
   * Ambil informasi user TikTok
   */
  async getUserInfo(username) {
    try {
      const cleanUsername = this.extractUsername(username);
      const userUrl = `https://www.tiktok.com/@${cleanUsername}`;

      const response = await axios.get(userUrl, {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      
      // Extract data dari script
      let userData = null;
      $('script').each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
          try {
            const jsonStr = content.match(/__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({.*?});/s);
            if (jsonStr && jsonStr[1]) {
              userData = JSON.parse(jsonStr[1]);
            }
          } catch (e) {
            // Ignore
          }
        }
      });

      // Fallback meta tags
      const metaData = {
        title: $('meta[property="og:title"]').attr('content') || 'N/A',
        description: $('meta[property="og:description"]').attr('content') || 'N/A',
        image: $('meta[property="og:image"]').attr('content') || null
      };

      let result = {
        platform: 'tiktok',
        type: 'user',
        url: userUrl,
        data: {
          username: cleanUsername,
          nickname: metaData.title,
          avatar: metaData.image,
          signature: metaData.description,
          verified: false,
          stats: {
            followers: 'N/A',
            following: 'N/A',
            likes: 'N/A',
            videos: 'N/A'
          }
        },
        scrapedAt: new Date().toISOString()
      };

      // Parse dari JSON jika ada
      if (userData) {
        const userDetail = userData?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
        const stats = userData?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats;
        
        if (userDetail) {
          result.data = {
            username: userDetail.uniqueId || cleanUsername,
            nickname: userDetail.nickname || metaData.title,
            avatar: userDetail.avatarLarger || userDetail.avatarMedium || metaData.image,
            signature: userDetail.signature || metaData.description,
            verified: userDetail.verified || false,
            privateAccount: userDetail.privateAccount || false,
            stats: {
              followers: stats?.followerCount || 'N/A',
              following: stats?.followingCount || 'N/A',
              likes: stats?.heartCount || stats?.heart || 'N/A',
              videos: stats?.videoCount || 'N/A'
            },
            bioLink: userDetail.bioLink?.link || null
          };
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get TikTok user info: ${error.message}`);
    }
  }

  /**
   * Ambil trending hashtags (simplified)
   */
  async getTrendingHashtags() {
    try {
      const trendingUrl = 'https://www.tiktok.com/trending';
      
      const response = await axios.get(trendingUrl, {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      
      const hashtags = [];
      
      // Extract dari meta atau visible content
      $('a[href*="/tag/"]').each((i, elem) => {
        const href = $(elem).attr('href');
        const match = href?.match(/\/tag\/([\w-]+)/);
        if (match && match[1] && !hashtags.includes(match[1])) {
          hashtags.push(match[1]);
        }
      });

      return {
        platform: 'tiktok',
        type: 'trending',
        hashtags: hashtags.slice(0, 20),
        count: hashtags.length,
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get TikTok trending: ${error.message}`);
    }
  }
}

export default TikTokScraper;
