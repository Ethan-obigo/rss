import { Podcast } from 'podcast';

/**
 * iTunes 표준 RSS 피드 생성
 * @param {Object} channelInfo - 채널 정보
 * @param {Array} videos - 영상 목록 (with audio paths)
 * @param {string} baseUrl - 서버 기본 URL (예: http://localhost:3000)
 * @returns {string} RSS XML
 */
export function generateRSS(channelInfo, videos, baseUrl) {
  const feed = new Podcast({
    title: channelInfo.title || 'Podcast Channel',
    description: channelInfo.summary || channelInfo.description || 'Podcast RSS Feed',
    feedUrl: `${baseUrl}/rss/${channelInfo.id}`,
    siteUrl: channelInfo.url || baseUrl,
    imageUrl: channelInfo.thumbnail || '',
    author: channelInfo.author || channelInfo.copyright || 'Unknown',
    copyright: channelInfo.copyright || channelInfo.author || '',
    language: channelInfo.language || 'ko',
    itunesAuthor: channelInfo.author || channelInfo.copyright || 'Unknown',
    itunesOwner: {
      name: channelInfo.owner?.name || channelInfo.author || 'Unknown',
      email: channelInfo.owner?.email || 'noreply@example.com'
    },
    itunesSummary: channelInfo.summary || channelInfo.description || '',
    itunesImage: channelInfo.thumbnail || '',
    itunesExplicit: false,
    itunesType: 'episodic',
    pubDate: new Date(),
    ttl: 60
  });

  // 각 영상/에피소드를 RSS 아이템으로 추가
  videos.forEach(video => {
    const item = {
      title: video.title,
      description: video.description || video.title,
      url: video.url,
      guid: video.id,
      date: video.publishedAt || video.uploadDate || new Date(),
      itunesAuthor: channelInfo.author || channelInfo.copyright || 'Unknown',
      itunesExplicit: false,
      itunesSubtitle: video.title,
      itunesSummary: video.description || video.title,
      itunesEpisodeType: 'full'
    };

    // 썸네일 이미지가 있으면 추가
    if (video.thumbnail) {
      item.itunesImage = video.thumbnail;
    }

    // 오디오 파일이 있으면 enclosure 추가
    if (video.audioPath) {
      item.enclosure = {
        url: video.audioPath,
        type: 'audio/mpeg'
      };
    }

    // duration이 있으면 추가
    if (video.duration) {
      item.itunesDuration = video.duration;
    }

    feed.addItem(item);
  });

  return feed.buildXml({ indent: true });
}
