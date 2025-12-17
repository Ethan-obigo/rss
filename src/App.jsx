import './App.css';
import { ChannelProvider } from './context/ChannelContext.jsx';
import YoutubeChannel from './feature/YoutubeChannel.jsx';
import PodbbangChannel from './feature/PodbbangChannel.jsx';
import SpotifyChannel from './feature/SpotifyChannel.jsx';
import ChannelCard from './feature/ChannelCard.jsx';

function App() {
  return (
    <ChannelProvider>
      <div className='app'>
        <header>
          <h1>RSS 피드 생성기</h1>
          <p>YouTube, 팟빵, Spotify를 RSS 피드로 변환</p>
        </header>
        <main>
          <YoutubeChannel />
          <PodbbangChannel />
          <SpotifyChannel />
          <ChannelCard />
        </main>
      </div>
    </ChannelProvider>
  );
}

export default App;
