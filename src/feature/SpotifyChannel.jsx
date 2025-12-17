import { useState } from 'react';
import { useChannels } from '../context/ChannelContext.jsx';
import { addSpotifyShow } from '../api.js';

function SpotifyChannel() {
  const { isLoading, setIsLoading, refreshChannels } = useChannels();
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyError, setSpotifyError] = useState('');

  async function handleAddSpotify(e) {
    e.preventDefault();
    setIsLoading(true);
    setSpotifyError('');

    try {
      const result = await addSpotifyShow(spotifyUrl);
      if (result.feedUrl) {
        await refreshChannels();
        setSpotifyUrl('');
        alert(`채널이 추가되었습니다.\nRSS URL: ${result.feedUrl}`);
      } else {
        setSpotifyError(
          result.error || 'Apple Podcasts에서 RSS 피드를 찾을 수 없습니다'
        );
      }
    } catch (err) {
      setSpotifyError(
        err.message || 'Apple Podcasts에서 RSS 피드를 찾을 수 없습니다'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='add-channel'>
      <h2>Spotify RSS 찾기</h2>
      <form onSubmit={handleAddSpotify}>
        <div className='form-group'>
          <input
            type='text'
            placeholder='https://open.spotify.com/show/...'
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type='submit' disabled={isLoading}>
            {isLoading ? 'RSS 검색 중...' : 'RSS 찾기'}
          </button>
        </div>
      </form>
      <p className='notice'>
        ※ Spotify 쇼 이름으로 Apple Podcasts에서 RSS 피드를 검색합니다.
      </p>
      {spotifyError && <div className='error'>{spotifyError}</div>}
    </section>
  );
}

export default SpotifyChannel;
