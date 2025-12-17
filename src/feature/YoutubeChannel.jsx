import { useState } from 'react';
import { addYouTubeChannel } from '../api';
import { useChannels } from '../context/ChannelContext.jsx';

function YoutubeChannel() {
  const { isLoading, setIsLoading, refreshChannels } = useChannels();
  const [youtubeError, setYoutubeError] = useState('');
  const [channelUrl, setChannelUrl] = useState('');

  async function handleAddChannel(e) {
    e.preventDefault();
    setIsLoading(true);
    setYoutubeError('');

    try {
      const result = await addYouTubeChannel(channelUrl);
      if (result.rssUrl) {
        await refreshChannels();
        setChannelUrl('');
        alert(`채널이 추가되었습니다.\nRSS URL: ${result.rssUrl}`);
      } else {
        setYoutubeError(result.error || '채널 추가 실패');
      }
    } catch (err) {
      setYoutubeError(err.message || '채널 추가 실패');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='add-channel'>
      <h2>YouTube 채널/플레이리스트 추가</h2>
      <form onSubmit={handleAddChannel}>
        <div className='form-group'>
          <input
            type='text'
            placeholder='youtube.com/@채널명 또는 youtube.com/playlist?list=...'
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type='submit' disabled={isLoading}>
            {isLoading ? '추가 중...' : '추가'}
          </button>
        </div>
      </form>
      <p className='notice'>
        ※ 오디오 추출 및 R2 업로드가 자동으로 진행됩니다. 시간이 소요될 수
        있습니다.
      </p>
      {youtubeError && <div className='error'>{youtubeError}</div>}
    </section>
  );
}

export default YoutubeChannel;
