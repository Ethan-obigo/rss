import { fetchSpotifyShow } from './lib/spotifyDownloader.js';

async function test() {
  console.log('Testing Spotify show with full episodes: 라플위클리...\n');

  try {
    const { channelInfo, episodes } = await fetchSpotifyShow('https://open.spotify.com/show/3i43TY8WaXnjJy5thpYPqh');

    console.log('\n=== Show Info ===');
    console.log('Title:', channelInfo.title);
    console.log('Description:', channelInfo.description?.substring(0, 100) + '...');
    console.log('Author:', channelInfo.author);
    console.log('Total Episodes:', episodes.length);

    console.log('\n=== First 3 Episodes ===');
    episodes.slice(0, 3).forEach((ep, idx) => {
      console.log(`\n[${idx + 1}] ${ep.title}`);
      console.log('    Published:', ep.publishedAt);
      console.log('    Duration:', ep.duration ? `${Math.floor(ep.duration / 60)}분 ${ep.duration % 60}초` : 'Unknown');
    });

    console.log('\n=== Last 3 Episodes ===');
    episodes.slice(-3).forEach((ep, idx) => {
      console.log(`\n[${episodes.length - 2 + idx}] ${ep.title}`);
      console.log('    Published:', ep.publishedAt);
    });
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
