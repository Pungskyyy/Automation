#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { YouTubeScraper } from './scrapers/youtube.js';
import { TikTokScraper } from './scrapers/tiktok.js';
import { InstagramScraper } from './scrapers/instagram.js';
import { TwitterScraper } from './scrapers/twitter.js';
import { Logger } from './utils/logger.js';
import { FileHandler } from './utils/fileHandler.js';

const program = new Command();

// Banner
const showBanner = () => {
  console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         SOCIAL MEDIA SCRAPER                              ║
║         Ambil Data dari YouTube, TikTok, Instagram, dll   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `));
};

// Display hasil dalam format yang bagus
const displayResult = (result) => {
  Logger.header(`${result.platform.toUpperCase()} - ${result.type.toUpperCase()}`);
  
  if (result.type === 'video') {
    Logger.section('Video Information');
    Logger.data('Title', result.data.title);
    Logger.data('URL', result.url);
    
    if (result.data.author) {
      Logger.section('Author Information');
      if (typeof result.data.author === 'string') {
        Logger.data('Author', result.data.author);
      } else {
        Logger.data('Name', result.data.author.name || result.data.author.username);
        if (result.data.author.verified) {
          Logger.data('Verified', chalk.green('✓ Yes'));
        }
      }
    }
    
    if (result.data.stats || result.data.views) {
      Logger.section('Statistics');
      if (result.data.views) {
        Logger.data('Views', result.data.views.formatted || result.data.views.count || result.data.views);
      }
      if (result.data.likes) {
        Logger.data('Likes', result.data.likes.formatted || result.data.likes.count || result.data.likes);
      }
      if (result.data.stats) {
        if (result.data.stats.views) Logger.data('Views', result.data.stats.views);
        if (result.data.stats.likes) Logger.data('Likes', result.data.stats.likes);
        if (result.data.stats.comments) Logger.data('Comments', result.data.stats.comments);
        if (result.data.stats.shares) Logger.data('Shares', result.data.stats.shares);
      }
    }
    
    if (result.data.duration) {
      Logger.data('Duration', result.data.duration.formatted || result.data.duration);
    }
    
    if (result.data.description) {
      Logger.section('Description');
      const desc = result.data.description.substring(0, 200);
      console.log(desc + (result.data.description.length > 200 ? '...' : ''));
    }
  } else if (result.type === 'user' || result.type === 'channel') {
    Logger.section('User/Channel Information');
    Logger.data('Username', result.data.username || result.data.name);
    Logger.data('URL', result.url);
    
    if (result.data.nickname) {
      Logger.data('Nickname', result.data.nickname);
    }
    
    if (result.data.verified) {
      Logger.data('Verified', chalk.green('✓ Yes'));
    }
    
    if (result.data.stats) {
      Logger.section('Statistics');
      if (result.data.stats.followers) Logger.data('Followers', result.data.stats.followers);
      if (result.data.stats.following) Logger.data('Following', result.data.stats.following);
      if (result.data.stats.likes) Logger.data('Likes', result.data.stats.likes);
      if (result.data.stats.videos) Logger.data('Videos', result.data.stats.videos);
      if (result.data.stats.posts) Logger.data('Posts', result.data.stats.posts);
      if (result.data.subscribers) Logger.data('Subscribers', result.data.subscribers);
      if (result.data.videoCount) Logger.data('Videos', result.data.videoCount);
    }
    
    if (result.data.bio || result.data.signature || result.data.description) {
      Logger.section('Bio/Description');
      console.log(result.data.bio || result.data.signature || result.data.description);
    }
  } else if (result.type === 'search') {
    Logger.section(`Search Results (${result.count} found)`);
    result.results.forEach((item, index) => {
      console.log(chalk.bold(`\n${index + 1}. ${item.title}`));
      Logger.data('  URL', item.url);
      if (item.views) Logger.data('  Views', item.views);
      if (item.duration) Logger.data('  Duration', item.duration);
      if (item.channel) Logger.data('  Channel', item.channel.name);
    });
  } else if (result.type === 'post') {
    Logger.section('Post Information');
    Logger.data('URL', result.url);
    
    if (result.data.author) {
      Logger.data('Author', result.data.author.username || result.data.author.name);
    }
    
    if (result.data.caption) {
      Logger.section('Caption');
      const caption = result.data.caption.substring(0, 200);
      console.log(caption + (result.data.caption.length > 200 ? '...' : ''));
    }
    
    if (result.data.stats) {
      Logger.section('Statistics');
      if (result.data.stats.likes) Logger.data('Likes', result.data.stats.likes);
      if (result.data.stats.comments) Logger.data('Comments', result.data.stats.comments);
    }
  } else if (result.type === 'tweet') {
    Logger.section('Tweet Information');
    Logger.data('URL', result.url);
    Logger.data('Author', result.data.author.username);
    
    Logger.section('Text');
    console.log(result.data.text);
    
    if (result.data.hashtags && result.data.hashtags.length > 0) {
      Logger.data('Hashtags', result.data.hashtags.join(', '));
    }
  }
  
  console.log('\n' + chalk.gray('Scraped at: ' + result.scrapedAt) + '\n');
};

// YouTube Commands
program
  .command('youtube')
  .description('Scrape data dari YouTube')
  .argument('<type>', 'Type: video, channel, search')
  .argument('<url-or-query>', 'URL atau search query')
  .option('-o, --output <file>', 'Save output to JSON file')
  .option('-l, --limit <number>', 'Limit results (for search)', '10')
  .action(async (type, urlOrQuery, options) => {
    const spinner = ora('Fetching YouTube data...').start();
    
    try {
      const scraper = new YouTubeScraper();
      let result;
      
      if (type === 'video') {
        result = await scraper.getVideoInfo(urlOrQuery);
      } else if (type === 'channel') {
        result = await scraper.getChannelInfo(urlOrQuery);
      } else if (type === 'search') {
        result = await scraper.searchVideos(urlOrQuery, parseInt(options.limit));
      } else {
        throw new Error('Invalid type. Use: video, channel, or search');
      }
      
      spinner.succeed('Data fetched successfully!');
      
      if (options.output) {
        const filepath = await FileHandler.saveJSON(result, options.output);
        Logger.success(`Data saved to: ${filepath}`);
      } else {
        displayResult(result);
      }
    } catch (error) {
      spinner.fail('Failed to fetch data');
      Logger.error(error.message);
      process.exit(1);
    }
  });

// TikTok Commands
program
  .command('tiktok')
  .description('Scrape data dari TikTok')
  .argument('<type>', 'Type: video, user, trending')
  .argument('[url-or-username]', 'URL atau username')
  .option('-o, --output <file>', 'Save output to JSON file')
  .action(async (type, urlOrUsername, options) => {
    const spinner = ora('Fetching TikTok data...').start();
    
    try {
      const scraper = new TikTokScraper();
      let result;
      
      if (type === 'video') {
        if (!urlOrUsername) throw new Error('URL required for video type');
        result = await scraper.getVideoInfo(urlOrUsername);
      } else if (type === 'user') {
        if (!urlOrUsername) throw new Error('Username required for user type');
        result = await scraper.getUserInfo(urlOrUsername);
      } else if (type === 'trending') {
        result = await scraper.getTrendingHashtags();
      } else {
        throw new Error('Invalid type. Use: video, user, or trending');
      }
      
      spinner.succeed('Data fetched successfully!');
      
      if (options.output) {
        const filepath = await FileHandler.saveJSON(result, options.output);
        Logger.success(`Data saved to: ${filepath}`);
      } else {
        displayResult(result);
      }
    } catch (error) {
      spinner.fail('Failed to fetch data');
      Logger.error(error.message);
      process.exit(1);
    }
  });

// Instagram Commands
program
  .command('instagram')
  .description('Scrape data dari Instagram')
  .argument('<type>', 'Type: post, user, user-posts')
  .argument('<url-or-username>', 'URL atau username')
  .option('-o, --output <file>', 'Save output to JSON file')
  .option('-l, --limit <number>', 'Limit posts (for user-posts)', '12')
  .action(async (type, urlOrUsername, options) => {
    const spinner = ora('Fetching Instagram data...').start();
    
    try {
      const scraper = new InstagramScraper();
      let result;
      
      if (type === 'post') {
        result = await scraper.getPostInfo(urlOrUsername);
      } else if (type === 'user') {
        result = await scraper.getUserInfo(urlOrUsername);
      } else if (type === 'user-posts') {
        result = await scraper.getUserPosts(urlOrUsername, parseInt(options.limit));
      } else {
        throw new Error('Invalid type. Use: post, user, or user-posts');
      }
      
      spinner.succeed('Data fetched successfully!');
      
      if (options.output) {
        const filepath = await FileHandler.saveJSON(result, options.output);
        Logger.success(`Data saved to: ${filepath}`);
      } else {
        displayResult(result);
      }
    } catch (error) {
      spinner.fail('Failed to fetch data');
      Logger.error(error.message);
      process.exit(1);
    }
  });

// Twitter Commands
program
  .command('twitter')
  .description('Scrape data dari Twitter/X')
  .argument('<type>', 'Type: tweet, user, trending')
  .argument('[url-or-username]', 'URL atau username')
  .option('-o, --output <file>', 'Save output to JSON file')
  .action(async (type, urlOrUsername, options) => {
    const spinner = ora('Fetching Twitter/X data...').start();
    
    try {
      const scraper = new TwitterScraper();
      let result;
      
      if (type === 'tweet') {
        if (!urlOrUsername) throw new Error('URL required for tweet type');
        result = await scraper.getTweetInfo(urlOrUsername);
      } else if (type === 'user') {
        if (!urlOrUsername) throw new Error('Username required for user type');
        result = await scraper.getUserInfo(urlOrUsername);
      } else if (type === 'trending') {
        result = await scraper.getTrending();
      } else {
        throw new Error('Invalid type. Use: tweet, user, or trending');
      }
      
      spinner.succeed('Data fetched successfully!');
      
      if (options.output) {
        const filepath = await FileHandler.saveJSON(result, options.output);
        Logger.success(`Data saved to: ${filepath}`);
      } else {
        displayResult(result);
      }
    } catch (error) {
      spinner.fail('Failed to fetch data');
      Logger.error(error.message);
      process.exit(1);
    }
  });

// Program info
program
  .name('social-scraper')
  .description('Aplikasi untuk mengambil data dari berbagai platform sosial media')
  .version('1.0.0')
  .hook('preAction', () => {
    showBanner();
  });

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  showBanner();
  program.outputHelp();
}
