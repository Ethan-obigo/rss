import { useState } from 'react';
import { useChannels } from '../context/ChannelContext.jsx';
import { addPodbbangChannel } from '../api.js';

function PodbbangChannel() {
  const { isLoading, setIsLoading, refreshChannels } = useChannels();
  const [podbbangId, setPodbbangId] = useState('');
  const [podbbangError, setPodbbangError] = useState('');

  async function handleAddPodbbang(e) {
    e.preventDefault();
    setIsLoading(true);
    setPodbbangError('');

    try {
      let channelId = podbbangId.trim();
      const urlMatch = channelId.match(/channels\/(\d+)/);

      if (urlMatch) {
        channelId = urlMatch[1];
      } else {
        channelId = channelId.replace(/\D/g, '');
      }

      if (!channelId) {
        setPodbbangError('유효한 채널 ID 또는 URL을 입력해주세요');
        setIsLoading(false);
        return;
      }

      const result = await addPodbbangChannel(channelId);

      if (result.rssUrl) {
        await refreshChannels();
        setPodbbangId('');
        alert(`채널이 추가되었습니다.\nRSS URL: ${result.rssUrl}`);
      } else {
        setPodbbangError(result.error || '팟빵 채널 추가 실패');
      }
    } catch (err) {
      setPodbbangError(err.message || '팟빵 채널 추가 실패');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='add-channel'>
      <h2>팟빵 채널 추가</h2>
      <form onSubmit={handleAddPodbbang}>
        <div className='form-group'>
          <input
            type='text'
            placeholder='podbbang.com/channels/1781651 또는 채널 ID'
            value={podbbangId}
            onChange={(e) => setPodbbangId(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type='submit' disabled={isLoading}>
            {isLoading ? '추가 중...' : '추가'}
          </button>
        </div>
      </form>
      {podbbangError && <div className='error'>{podbbangError}</div>}
    </section>
  );
}

export default PodbbangChannel;
