// podbbangDownloader.js
import https from 'https';

/**
 * HTTPS GET 요청 헬퍼 함수
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error(`JSON parse error: ${err.message}`));
          }
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 팟빵 채널 정보 및 에피소드 정보를 가져옵니다.
 * @param {string} channelId - 팟빵 채널 ID (예: 1781651)
 * @returns {Promise<Object>} 채널 정보 및 에피소드 목록
 */
export async function fetchPodbbangChannel(channelId) {
  try {
    // 먼저 첫 페이지를 가져와서 총 개수 확인
    const firstPageUrl = `https://app-api6.podbbang.com/channels/${channelId}/episodes?offset=0&limit=20&sort=desc&episode_id=0&focus_center=0&with=image`;
    const firstPageData = await httpsGet(firstPageUrl);

    const totalCount = firstPageData.summary?.totalCount || 0;
    let allEpisodes = [...firstPageData.data];

    console.log(`Podbbang Channel ${channelId}: Total ${totalCount} episodes, fetched ${allEpisodes.length} in first page`);

    // 나머지 페이지들을 가져오기 (20개씩)
    if (totalCount > 20) {
      const numPages = Math.ceil(totalCount / 20);
      console.log(`Fetching ${numPages - 1} more pages...`);

      for (let pageNum = 1; pageNum < numPages; pageNum++) {
        const pageUrl = `https://app-api6.podbbang.com/channels/${channelId}/episodes?offset=${pageNum}&limit=20&sort=desc&episode_id=0&focus_center=0&with=image`;
        console.log(`Fetching page ${pageNum + 1} with offset ${pageNum}...`);
        const pageData = await httpsGet(pageUrl);

        if (pageData.data && pageData.data.length > 0) {
          allEpisodes = allEpisodes.concat(pageData.data);
          console.log(`Page ${pageNum + 1}: got ${pageData.data.length} episodes, total now: ${allEpisodes.length}`);
        } else {
          console.log(`Page ${pageNum + 1}: no data`);
        }
      }
    }

    console.log(`Final total: ${allEpisodes.length} episodes`);

    // 채널 정보 API 호출
    const channelUrl = `https://app-api6.podbbang.com/channels/${channelId}`;
    const channelData = await httpsGet(channelUrl);

    const episodesData = { data: allEpisodes, summary: firstPageData.summary };

    // 채널 정보 구성
    const channelInfo = {
      id: channelId,
      title: channelData.title || 'Podbbang Channel',
      description: channelData.description || channelData.summary || '',
      summary: channelData.summary || channelData.description || '',
      url: `https://www.podbbang.com/channels/${channelId}`,
      thumbnail: channelData.image || channelData.thumbnail?.url || '',
      author: channelData.mc || channelData.copyright || 'Unknown',
      copyright: channelData.copyright || '',
      owner: {
        name: channelData.mc || channelData.copyright || 'Unknown',
        email: channelData.contacts?.email || ''
      },
      language: 'ko',
      addedAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      type: 'podbbang'
    };

    // 에피소드 정보 파싱
    const episodes = episodesData.data?.map(episode => ({
      id: episode.id.toString(),
      title: episode.title || 'Untitled Episode',
      description: episode.description || '',
      url: `https://www.podbbang.com/channels/${channelId}/episodes/${episode.id}`,
      audioPath: episode.media?.url || '',
      thumbnail: episode.thumbnail?.url || episode.image?.url || '',
      publishedAt: episode.published_at || episode.created_at || new Date().toISOString(),
      duration: episode.duration || null
    })) || [];

    return {
      channelInfo,
      episodes
    };
  } catch (error) {
    console.error('Podbbang fetch error:', error);
    throw error;
  }
}

/**
 * 팟빵 채널 정보를 업데이트합니다.
 * @param {string} channelId - 팟빵 채널 ID
 * @returns {Promise<Array>} 새로운 에피소드 목록
 */
export async function updatePodbbangChannel(channelId) {
  const { episodes } = await fetchPodbbangChannel(channelId);
  return episodes;
}
