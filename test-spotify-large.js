import { fetchSpotifyShow } from './lib/spotifyDownloader.js';

async function test() {
  // 더 많은 에피소드를 가진 쇼로 테스트
  // The Joe Rogan Experience - 매우 많은 에피소드
  const showUrl = 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk';

  console.log('Testing large Spotify show with many episodes...\n');

  try {
    const { channelInfo, episodes } = await fetchSpotifyShow(showUrl);

    console.log('\n=== Show Info ===');
    console.log('Title:', channelInfo.title);
    console.log('Author:', channelInfo.author);
    console.log('Total Episodes:', episodes.length);

    console.log('\n=== First 3 Episodes ===');
    episodes.slice(0, 3).forEach((ep, idx) => {
      console.log(`[${idx + 1}] ${ep.title}`);
    });

    console.log('\n=== Last 3 Episodes ===');
    episodes.slice(-3).forEach((ep, idx) => {
      console.log(`[${episodes.length - 2 + idx}] ${ep.title}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
