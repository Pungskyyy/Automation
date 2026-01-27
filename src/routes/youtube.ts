import express from 'express';
import { YouTubeService } from '../services/youtubeService';

const router = express.Router();
const youtubeService = new YouTubeService();

// Search videos
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = '10' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({ error: 'Limit must be a number between 1 and 50' });
    }

    const videos = await youtubeService.searchVideos(query, limitNum);
    res.json({ success: true, data: videos });
  } catch (error) {
    console.error('Error in YouTube search:', error);
    res.status(500).json({ error: 'Failed to search YouTube videos' });
  }
});

// Get video details
router.get('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await youtubeService.getVideoDetails(videoId);
    res.json({ success: true, data: video });
  } catch (error) {
    console.error('Error getting video details:', error);
    res.status(500).json({ error: 'Failed to get video details' });
  }
});

// Get channel details
router.get('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await youtubeService.getChannelDetails(channelId);
    res.json({ success: true, data: channel });
  } catch (error) {
    console.error('Error getting channel details:', error);
    res.status(500).json({ error: 'Failed to get channel details' });
  }
});

export { router as youtubeRouter };