import YTDlpWrap from 'yt-dlp-wrap';
const YTDlp = YTDlpWrap.default || YTDlpWrap;
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadToSupabase } from './supabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.join(__dirname, '..', 'storage', 'audio');

// Vercel/배포 환경에서는 시스템 yt-dlp 사용, 로컬에서는 bin/yt-dlp.exe 사용
const YT_DLP_PATH = process.env.NODE_ENV === 'production'
  ? 'yt-dlp'  // 시스템에 설치된 yt-dlp 사용
  : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');

const FFMPEG_PATH = path.join(__dirname, '..', 'bin');

/**
 * YouTube 채널 정보 가져오기
 * @param {string} channelUrl - YouTube 채널 URL
 * @returns {Promise<Object>} 채널 정보 (id, title)
 */
export async function getChannelInfo(channelUrl) {
  const ytDlp = new YTDlp(YT_DLP_PATH);

  try {
    const metadata = await ytDlp.execPromise([
      channelUrl,
      '--flat-playlist',
      '--dump-json',
      '--playlist-end=1',
      '--no-warnings',
      '--extractor-args', 'youtube:lang=ko'
    ]);

    const firstLine = metadata.split('\n').find(line => line.trim());
    if (!firstLine) {
      throw new Error('메타 데이터를 찾을 수 없습니다.');
    }

    const data = JSON.parse(firstLine);
    return {
      id: data.playlist_channel_id || data.channel_id || data.uploader_id,
      title: data.playlist_channel || data.channel || data.uploader || 'Unknown Channel'
    };
  } catch (error) {
    console.error('Failed to get channel info:', error);
    throw error;
  }
}

/**
 * YouTube 채널의 최신 영상 목록 가져오기
 * @param {string} channelUrl - YouTube 채널 URL
 * @param {number} limit - 가져올 영상 개수 (기본: 10)
 * @returns {Promise<Array>} 영상 정보 배열
 */
export async function getChannelVideos(channelUrl, limit = 10) {
  const ytDlp = new YTDlp(YT_DLP_PATH);

  try {
    const metadata = await ytDlp.execPromise([
      channelUrl,
      '--flat-playlist',
      '--dump-json',
      `--playlist-end=${limit}`,
      '--no-warnings',
      '--extractor-args', 'youtube:lang=ko'
    ]);

    const lines = metadata.split('\n').filter(line => line.trim());
    const videos = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(v => v);

    return videos.map(video => ({
      id: video.id,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      uploadDate: video.upload_date || null,
      duration: video.duration || null
    }));

  } catch (error) {
    console.error('Failed to get channel videos:', error);
    throw error;
  }
}

/**
 * YouTube 영상의 오디오 추출 및 Supabase 업로드
 * @param {string} videoUrl - YouTube 영상 URL
 * @param {string} videoId - 영상 ID
 * @returns {Promise<string>} Supabase Storage의 공개 URL
 */
export async function downloadAudio(videoUrl, videoId) {
  const ytDlp = new YTDlp(YT_DLP_PATH);

  // 임시 디렉토리 생성
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  // 임시 파일 경로
  const tempOutputPath = path.join(AUDIO_DIR, `${videoId}.mp3`);

  try {
    console.log(`Downloading audio: ${videoId}...`);

    // 1. 로컬에 임시로 다운로드
    const ffmpegArgs = process.env.NODE_ENV === 'production'
      ? [] // 배포 환경에서는 시스템 ffmpeg 사용
      : ['--ffmpeg-location', FFMPEG_PATH];

    await ytDlp.execPromise([
      videoUrl,
      ...ffmpegArgs,
      '-x',                           // 오디오만 추출
      '--audio-format', 'mp3',        // MP3 형식
      '--audio-quality', '0',         // 최고 품질
      '-o', tempOutputPath.replace('.mp3', '.%(ext)s'), // 출력 경로
      '--no-warnings',
      '--no-playlist'                 // 재생목록 무시
    ]);

    console.log(`Audio downloaded: ${videoId}.mp3`);

    // 2. Supabase Storage에 업로드
    console.log(`Uploading to Supabase: ${videoId}...`);
    const storageFileKey = `episodes/${videoId}`;
    const supabaseUrl = await uploadToSupabase(tempOutputPath, storageFileKey);

    console.log(`Uploaded to Supabase: ${supabaseUrl}`);

    // 3. 임시 파일 삭제
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
      console.log(`Temporary file deleted: ${videoId}.mp3`);
    }

    return supabaseUrl;

  } catch (error) {
    // 에러 발생 시에도 임시 파일 정리
    if (fs.existsSync(tempOutputPath)) {
      try {
        fs.unlinkSync(tempOutputPath);
        console.log(`Temporary file deleted after error: ${videoId}.mp3`);
      } catch (unlinkError) {
        console.error(`Failed to delete temporary file: ${unlinkError.message}`);
      }
    }

    console.error(`Failed to download/upload audio for ${videoId}:`, error);
    throw error;
  }
}

/**
 * 파일명 정제
 * @param {string} filename
 * @returns {string}
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}
