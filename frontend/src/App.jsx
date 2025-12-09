import { useState, useEffect } from 'react'
import './App.css'
import { getChannels, addChannel, addPodbbangChannel, addSpotifyShow, downloadChannel, deleteChannel, getRssUrl } from './api'

function App() {
  const [channels, setChannels] = useState([])
  const [channelUrl, setChannelUrl] = useState('')
  const [podbbangId, setPodbbangId] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const limit = 0 // 전체 영상 가져오기
  const [loading, setLoading] = useState(false)
  const [youtubeError, setYoutubeError] = useState('')
  const [podbbangError, setPodbbangError] = useState('')
  const [spotifyError, setSpotifyError] = useState('')
  const [downloadingChannels, setDownloadingChannels] = useState(new Set())

  useEffect(() => {
    loadChannels()
  }, [])

  async function loadChannels() {
    try {
      const data = await getChannels()
      setChannels(data)
    } catch (err) {
      console.error('Failed to load channels:', err)
    }
  }

  async function handleAddChannel(e) {
    e.preventDefault()
    setLoading(true)
    setYoutubeError('')

    try {
      const result = await addChannel(channelUrl, limit)
      if (result.success) {
        await loadChannels()
        setChannelUrl('')
      } else {
        setYoutubeError(result.error || '채널 추가 실패')
      }
    } catch (err) {
      setYoutubeError(err.message || '채널 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPodbbang(e) {
    e.preventDefault()
    setLoading(true)
    setPodbbangError('')

    try {
      // URL에서 채널 ID 추출 (숫자만 추출)
      let channelId = podbbangId.trim()

      // URL 형식인 경우 ID만 추출
      const urlMatch = channelId.match(/channels\/(\d+)/)
      if (urlMatch) {
        channelId = urlMatch[1]
      } else {
        // 숫자만 남기기
        channelId = channelId.replace(/\D/g, '')
      }

      if (!channelId) {
        setPodbbangError('유효한 채널 ID 또는 URL을 입력해주세요')
        setLoading(false)
        return
      }

      const result = await addPodbbangChannel(channelId)
      if (result.success) {
        await loadChannels()
        setPodbbangId('')
      } else {
        setPodbbangError(result.error || '팟빵 채널 추가 실패')
      }
    } catch (err) {
      setPodbbangError(err.message || '팟빵 채널 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSpotify(e) {
    e.preventDefault()
    setLoading(true)
    setSpotifyError('')

    try {
      const result = await addSpotifyShow(spotifyUrl)
      if (result.success) {
        await loadChannels()
        setSpotifyUrl('')
      } else {
        setSpotifyError(result.error || 'Spotify 쇼 추가 실패')
      }
    } catch (err) {
      setSpotifyError(err.message || 'Spotify 쇼 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(channelId) {
    setDownloadingChannels(prev => new Set(prev).add(channelId))

    try {
      const result = await downloadChannel(channelId)
      if (result.success) {
        alert(`${result.downloaded}개 영상 다운로드 완료`)
        await loadChannels()
      } else {
        alert('다운로드 실패: ' + (result.error || '알 수 없는 오류'))
      }
    } catch (err) {
      alert('다운로드 실패: ' + err.message)
    } finally {
      setDownloadingChannels(prev => {
        const next = new Set(prev)
        next.delete(channelId)
        return next
      })
    }
  }

  function copyRssUrl(channelId) {
    const url = getRssUrl(channelId)
    navigator.clipboard.writeText(url)
    alert('RSS URL이 복사되었습니다')
  }

  async function handleDeleteChannel(channelId, channelTitle) {
    if (!confirm(`"${channelTitle}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteChannel(channelId)
      if (result.success) {
        await loadChannels()
      } else {
        alert('삭제 실패: ' + (result.error || '알 수 없는 오류'))
      }
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>RSS 피드 생성기</h1>
        <p>YouTube, 팟빵, Spotify를 RSS 피드로 변환</p>
      </header>

      <main>
        <section className="add-channel">
          <h2>YouTube 채널/플레이리스트 추가</h2>
          <form onSubmit={handleAddChannel}>
            <div className="form-group">
              <input
                type="text"
                placeholder="youtube.com/@채널명 또는 youtube.com/playlist?list=..."
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                required
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? '추가 중...' : '추가'}
              </button>
            </div>
          </form>
          <p className="notice">※ 현재 배포 환경에서는 미지원됩니다.</p>
          {youtubeError && <div className="error">{youtubeError}</div>}
        </section>

        <section className="add-channel">
          <h2>팟빵 채널 추가</h2>
          <form onSubmit={handleAddPodbbang}>
            <div className="form-group">
              <input
                type="text"
                placeholder="podbbang.com/channels/1781651 또는 채널 ID"
                value={podbbangId}
                onChange={(e) => setPodbbangId(e.target.value)}
                required
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? '추가 중...' : '추가'}
              </button>
            </div>
          </form>
          {podbbangError && <div className="error">{podbbangError}</div>}
        </section>

        <section className="add-channel">
          <h2>Spotify 쇼 추가</h2>
          <form onSubmit={handleAddSpotify}>
            <div className="form-group">
              <input
                type="text"
                placeholder="https://open.spotify.com/show/..."
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                required
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? '추가 중...' : '추가'}
              </button>
            </div>
          </form>
          {spotifyError && <div className="error">{spotifyError}</div>}
        </section>

        <section className="channels">
          <h2>채널 목록 ({channels.length})</h2>
          {channels.length === 0 ? (
            <p className="empty">아직 추가된 채널이 없습니다</p>
          ) : (
            <div className="channel-list">
              {channels.map((channel) => (
                <div key={channel.id} className="channel-card">
                  <div className="channel-info">
                    <h3>
                      {channel.type === 'podbbang' && <span className="platform-badge podbbang">팟빵</span>}
                      {channel.type === 'spotify' && <span className="platform-badge spotify">Spotify</span>}
                      {channel.type === 'playlist' && <span className="platform-badge youtube">플레이리스트</span>}
                      {(!channel.type || channel.type === 'youtube' || channel.type === 'channel') && <span className="platform-badge youtube">YouTube</span>}
                      {channel.title}
                    </h3>
                    <p className="channel-url">{channel.url}</p>
                    <p className="channel-meta">
                      {channel.videos.length}개 에피소드 · {new Date(channel.addedAt).toLocaleDateString('ko-KR')} 추가
                    </p>
                  </div>
                  <div className="channel-actions">
                    {(!channel.type || channel.type === 'youtube' || channel.type === 'channel' || channel.type === 'playlist') && (
                      <button
                        onClick={() => handleDownload(channel.id)}
                        disabled={downloadingChannels.has(channel.id)}
                        className="btn-download"
                      >
                        {downloadingChannels.has(channel.id) ? '다운로드 중...' : '다운로드'}
                      </button>
                    )}
                    <button onClick={() => copyRssUrl(channel.id)} className="btn-rss">
                      RSS 복사
                    </button>
                    <button onClick={() => handleDeleteChannel(channel.id, channel.title)} className="btn-delete">
                      삭제
                    </button>
                  </div>
                  <div className="rss-link">
                    <code>{getRssUrl(channel.id)}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
