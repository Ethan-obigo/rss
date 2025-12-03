import RSS from 'rss';

/**
 * RSS 피드 생성
 * @param {Object} channelInfo - 채널 정보
 * @param {Array} videos - 영상 목록 (with audio paths)
 * @param {string} baseUrl - 서버 기본 URL (예: http://localhost:3000)
 * @returns {string} RSS XML
 */
export function generateRSS(channelInfo, videos, baseUrl) {
  const feed = new RSS({
    title: channelInfo.title || 'YouTube Channel',
    description: channelInfo.description || 'Converted from YouTube',
    feed_url: `${baseUrl}/rss/${channelInfo.id}`,
    site_url: channelInfo.url || 'https://youtube.com',
    language: 'ko',
    pubDate: new Date(),
    ttl: 60 // 60분마다 갱신
  });

  // 각 영상/에피소드를 RSS 아이템으로 추가
  videos.forEach(video => {
    const item = {
      title: video.title,
      description: video.description || video.title,
      url: video.url,
      guid: video.id,
      date: video.publishedAt || video.uploadDate || new Date()
    };

    // 썸네일이 있으면 description에 이미지 추가
    if (video.thumbnail) {
      item.description = `<img src="${video.thumbnail}" alt="${video.title}" /><br/>${item.description}`;
    }

    // 오디오 파일이 있으면 enclosure 추가
    if (video.audioPath) {
      item.enclosure = {
        url: video.audioPath,
        type: 'audio/mpeg'
      };

      // duration이 있으면 추가 (초 단위)
      if (video.duration) {
        item.enclosure.length = video.duration;
      }
    }

    // 커스텀 필드 추가 (팟캐스트 앱 지원)
    if (video.duration) {
      item.custom_elements = [
        { 'itunes:duration': video.duration }
      ];
    }

    feed.item(item);
  });

  return feed.xml({ indent: true });
}
