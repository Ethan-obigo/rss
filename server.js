console.log('--- SERVER.JS LOADED ---');

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import channelDB from './lib/channelDB.js';
import {
  getChannelInfo,
  getChannelVideos,
  downloadAudio,
} from './lib/ytDownloader.js';
import { generateRSS } from './lib/rssGenerator.js';
import {
  fetchPodbbangChannel,
  updatePodbbangChannel,
} from './lib/podbbangDownloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// 오디오 파일 저장 디렉토리
const AUDIO_DIR = path.join(__dirname, 'storage', 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// 정적 파일 제공 (오디오 파일)
app.use('/audio', express.static(AUDIO_DIR));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const channels = await channelDB.getAllChannels();
    res.json({
      status: 'ok',
      message: 'YouTube RSS Maker is running',
      audioDir: AUDIO_DIR,
      channels: channels.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/channels', async (req, res) => {
  console.log('RSS: Channel not found:');
  try {
    const channels = await channelDB.getAllChannels();
    res.json({ channels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/channel', async (req, res) => {
  const { channelUrl, limit = 10 } = req.body;

  if (!channelUrl) {
    return res.status(400).json({ error: 'channelUrl is required' });
  }

  try {
    const channelInfo = await getChannelInfo(channelUrl);
    const videos = await getChannelVideos(channelUrl, limit);

    if (videos.length === 0) {
      return res.status(404).json({ error: 'No videos found' });
    }

    const channel = await channelDB.addChannel({
      id: channelInfo.id,
      title: channelInfo.title,
      url: channelUrl,
    });

    await channelDB.updateChannelVideos(channelInfo.id, videos);

    res.json({
      success: true,
      channel,
      videos: videos.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const downloadHandler = async (req, res) => {
  const { channelId } = req.params;

  try {
    const channel = await channelDB.getChannel(channelId);

    if (!channel) {
      return res.status(404).json({ error: '채널이 존재하지 않습니다.' });
    }

    const results = [];

    for (const video of channel.videos) {
      try {
        const audioPath = await downloadAudio(video.url, video.id);
        results.push({ videoId: video.id, success: true, path: audioPath });
      } catch (error) {
        results.push({
          videoId: video.id,
          success: false,
          error: error.message,
        });
      }
    }

    const updatedVideos = channel.videos.map((video) => {
      const result = results.find((r) => r.videoId === video.id && r.success);
      if (result) {
        return { ...video, audioPath: result.path };
      }
      return video;
    });

    await channelDB.updateChannelVideos(channelId, updatedVideos);

    res.json({
      success: true,
      downloaded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Error downloading audio:', error);
    res.status(500).json({ error: error.message });
  }
};

app.get('/api/download/:channelId', downloadHandler);
app.post('/api/download/:channelId', downloadHandler);

app.delete('/api/channel/:channelId', async (req, res) => {
  const { channelId } = req.params;

  try {
    const channel = await channelDB.getChannel(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    await channelDB.deleteChannel(channelId);
    res.json({ success: true, message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 팟빵 채널 추가
app.post('/api/podbbang/channel', async (req, res) => {
  const { channelId } = req.body;

  if (!channelId) {
    return res.status(400).json({ error: 'channelId is required' });
  }

  try {
    const { channelInfo, episodes } = await fetchPodbbangChannel(channelId);

    // 채널 DB에 추가
    const channelData = {
      ...channelInfo,
      id: `podbbang_${channelId}`,
      type: 'podbbang',
      originalId: channelId,
    };

    const channel = await channelDB.addChannel(channelData);

    await channelDB.updateChannelVideos(`podbbang_${channelId}`, episodes);

    res.json({
      success: true,
      channel,
      episodes: episodes.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 팟빵 채널 업데이트
app.post('/api/podbbang/update/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const fullChannelId = `podbbang_${channelId}`;

  try {
    const channel = await channelDB.getChannel(fullChannelId);

    if (!channel) {
      return res.status(404).json({ error: '채널이 존재하지 않습니다.' });
    }

    const episodes = await updatePodbbangChannel(channelId);
    await channelDB.updateChannelVideos(fullChannelId, episodes);

    res.json({
      success: true,
      updated: episodes.length,
    });
  } catch (error) {
    console.error('Error updating Podbbang channel:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/rss/:channelId', async (req, res) => {
  const { channelId } = req.params;

  try {
    const channel = await channelDB.getChannel(channelId);

    if (!channel) {
      console.error('RSS: Channel not found:', channelId);
      return res.status(404).send('Channel not found');
    }

    const rssXML = generateRSS(
      {
        id: channel.id,
        title: channel.title,
        description:
          channel.description ||
          channel.summary ||
          `RSS feed for ${channel.title}`,
        summary: channel.summary || channel.description,
        url: channel.url,
        thumbnail: channel.thumbnail,
        author: channel.author,
        copyright: channel.copyright,
        owner: channel.owner,
        language: channel.language,
      },
      channel.videos,
      BASE_URL
    );

    res.set('Content-Type', 'application/rss+xml');
    res.send(rssXML);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res
      .status(500)
      .send(
        `Error generating RSS feed: ${error.message}. Stack: ${error.stack}`
      );
  }
});

export default app;
