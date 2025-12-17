import { deleteChannel, getRssUrl, updateChannel } from '../api.js';
import { useChannels } from '../context/ChannelContext.jsx';

function ChannelCard() {
  const { channels, refreshChannels } = useChannels();

  function copyRssUrl(channel) {
    const url = channel.externalRssUrl || getRssUrl(channel.id);
    navigator.clipboard.writeText(url);
    alert('RSS URL이 복사되었습니다');
  }

  async function handleDeleteChannel(channelId, channelTitle) {
    if (!confirm(`"${channelTitle}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteChannel(channelId);
      if (result.success) {
        await refreshChannels();
      } else {
        alert('삭제 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  }

  async function handleUpdate(channelId, type) {
    try {
      await updateChannel(channelId, type);
      await refreshChannels();
    } catch (err) {
      console.error(err);
      alert('업데이트 실패');
    }
  }

  return (
    <section className='channels'>
      <h2>채널 목록 ({channels.length})</h2>
      {channels.length === 0 ? (
        <p className='empty'>아직 추가된 채널이 없습니다</p>
      ) : (
        <div className='channel-list'>
          {channels.map((channel) => (
            <div key={channel.id} className='channel-card'>
              <div className='channel-info'>
                <h3>
                  {channel.type === 'podbbang' && (
                    <span className='platform-badge podbbang'>팟빵</span>
                  )}
                  {channel.type === 'spotify' && (
                    <span className='platform-badge spotify'>Spotify</span>
                  )}
                  {channel.type === 'playlist' && (
                    <span className='platform-badge youtube'>플레이리스트</span>
                  )}
                  {(!channel.type ||
                    channel.type === 'youtube' ||
                    channel.type === 'channel') && (
                    <span className='platform-badge youtube'>YouTube</span>
                  )}
                  {channel.title}
                </h3>
                <p className='channel-url'>{channel.url}</p>
                <p className='channel-meta'>
                  {channel.videos.length}개 에피소드 ·{' '}
                  {new Date(channel.addedAt).toLocaleDateString('ko-KR')} 추가
                </p>
              </div>
              <div className='channel-actions'>
                <button onClick={() => copyRssUrl(channel)} className='btn-rss'>
                  RSS 복사
                </button>
                <button
                  onClick={() => handleDeleteChannel(channel.id, channel.title)}
                  className='btn-delete'
                >
                  삭제
                </button>
                <button onClick={() => handleUpdate(channel.id, channel.type)}>
                  업데이트
                </button>
              </div>
              <div className='rss-link'>
                <code>{channel.externalRssUrl || getRssUrl(channel.id)}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ChannelCard;
