// spotifyDownloader.js
import 'dotenv/config';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * 스포티파이 API 액세스 토큰을 받아옵니다.
 * @returns {Promise<string>} 액세스 토큰
 */
async function getSpotifyToken() {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: SPOTIFY_CLIENT_SECRET
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!res.ok) {
    throw new Error(`Failed to get Spotify token: ${res.status} ${res.statusText}`);
  }

  const { access_token: token } = await res.json();
  return token;
}

/**
 * 스포티파이 쇼 ID를 URL에서 추출합니다.
 * @param {string} url - 스포티파이 쇼 URL
 * @returns {string} 쇼 ID
 */
function extractShowId(url) {
  const match = url.match(/show\/([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error('Invalid Spotify show URL');
  }
  return match[1];
}

/**
 * 스포티파이 쇼 정보 및 에피소드 정보를 가져옵니다.
 * @param {string} showUrl - 스포티파이 쇼 URL
 * @returns {Promise<Object>} 쇼 정보 및 에피소드 목록
 */
export async function fetchSpotifyShow(showUrl) {
  try {
    const showId = extractShowId(showUrl);
    const token = await getSpotifyToken();

    console.log(`Fetching Spotify show: ${showId}`);

    // 스포티파이 API를 사용하여 쇼 데이터 가져오기
    const showRes = await fetch(`https://api.spotify.com/v1/shows/${showId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!showRes.ok) {
      throw new Error(`Failed to fetch show: ${showRes.status} ${showRes.statusText}`);
    }

    const showData = await showRes.json();

    console.log(`Spotify Show: ${showData.name}`);
    console.log(`Publisher: ${showData.publisher}`);
    console.log(`Total episodes:`, showData.total_episodes || 0);

    // 쇼 정보 구성
    const channelInfo = {
      id: showId,
      title: showData.name || 'Spotify Podcast',
      description: showData.description || '',
      summary: showData.description || '',
      url: showUrl,
      thumbnail: showData.images?.[0]?.url || '',
      author: showData.publisher || 'Unknown',
      copyright: showData.publisher || '',
      owner: {
        name: showData.publisher || 'Unknown',
        email: ''
      },
      language: showData.language || 'ko',
      addedAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      type: 'spotify'
    };

    // 전체 에피소드 정보 가져오기 (페이지네이션)
    let allEpisodes = [];
    let offset = 0;
    const limit = 50; // 스포티파이 API 최대값
    const totalEpisodes = showData.total_episodes || 0;

    console.log(`Fetching ${totalEpisodes} episodes...`);

    while (offset < totalEpisodes) {
      const episodesRes = await fetch(
        `https://api.spotify.com/v1/shows/${showId}/episodes?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!episodesRes.ok) {
        throw new Error(`Failed to fetch episodes at offset ${offset}: ${episodesRes.status} ${episodesRes.statusText}`);
      }

      const episodesData = await episodesRes.json();

      if (!episodesData.items || episodesData.items.length === 0) {
        break;
      }

      allEpisodes = allEpisodes.concat(episodesData.items);
      console.log(`Fetched ${allEpisodes.length}/${totalEpisodes} episodes`);

      offset += limit;

      // API 레이트 리미트를 피하기 위해 약간의 딜레이
      if (offset < totalEpisodes) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const episodes = allEpisodes.map(episode => ({
      id: episode.id,
      title: episode.name || 'Untitled Episode',
      description: episode.description || episode.html_description || '',
      url: episode.external_urls?.spotify || `https://open.spotify.com/episode/${episode.id}`,
      audioPath: episode.audio_preview_url || '',
      thumbnail: episode.images?.[0]?.url || channelInfo.thumbnail,
      publishedAt: episode.release_date || new Date().toISOString(),
      duration: episode.duration_ms ? Math.floor(episode.duration_ms / 1000) : null
    }));

    console.log(`Parsed ${episodes.length} episodes`);

    return {
      channelInfo,
      episodes
    };
  } catch (error) {
    console.error('Spotify fetch error:', error);
    throw error;
  }
}

/**
 * 스포티파이 쇼 정보를 업데이트합니다.
 * @param {string} showUrl - 스포티파이 쇼 URL
 * @returns {Promise<Array>} 새로운 에피소드 목록
 */
export async function updateSpotifyShow(showUrl) {
  const { episodes } = await fetchSpotifyShow(showUrl);
  return episodes;
}
