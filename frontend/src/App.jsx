import { useState, useEffect } from 'react'
import './App.css'
import { getChannels, addChannel, addPodbbangChannel, downloadChannel, deleteChannel, getRssUrl } from './api'

function App() {
  const [channels, setChannels] = useState([])
  const [channelUrl, setChannelUrl] = useState('')
  const [podbbangId, setPodbbangId] = useState('')
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [youtubeError, setYoutubeError] = useState('')
  const [podbbangError, setPodbbangError] = useState('')
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
        setLimit(10)
      } else {
        setYoutubeError(result.error || 'Failed to add channel')
      }
    } catch (err) {
      setYoutubeError(err.message || 'Failed to add channel')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPodbbang(e) {
    e.preventDefault()
    setLoading(true)
    setPodbbangError('')

    try {
      const result = await addPodbbangChannel(podbbangId)
      if (result.success) {
        await loadChannels()
        setPodbbangId('')
      } else {
        setPodbbangError(result.error || 'Failed to add Podbbang channel')
      }
    } catch (err) {
      setPodbbangError(err.message || 'Failed to add Podbbang channel')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(channelId) {
    setDownloadingChannels(prev => new Set(prev).add(channelId))

    try {
      const result = await downloadChannel(channelId)
      if (result.success) {
        alert(`Downloaded ${result.downloaded} videos`)
        await loadChannels()
      } else {
        alert('Download failed: ' + (result.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Download failed: ' + err.message)
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
    alert('RSS URL copied')
  }

  async function handleDeleteChannel(channelId, channelTitle) {
    if (!confirm(`Delete "${channelTitle}"?`)) {
      return
    }

    try {
      const result = await deleteChannel(channelId)
      if (result.success) {
        await loadChannels()
      } else {
        alert('Delete failed: ' + (result.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>RSS Maker</h1>
        <p>Convert YouTube and Podbbang to RSS feeds</p>
      </header>

      <main>
        <section className="add-channel">
          <h2>Add YouTube Channel</h2>
          <form onSubmit={handleAddChannel}>
            <div className="form-group">
              <input
                type="text"
                placeholder="youtube.com/@channel"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                required
                disabled={loading}
              />
              <input
                type="number"
                placeholder="Limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min="1"
                max="50"
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
          {youtubeError && <div className="error">{youtubeError}</div>}
        </section>

        <section className="add-channel">
          <h2>Add Podbbang Channel</h2>
          <form onSubmit={handleAddPodbbang}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Channel ID (e.g. 1781651)"
                value={podbbangId}
                onChange={(e) => setPodbbangId(e.target.value)}
                required
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
          {podbbangError && <div className="error">{podbbangError}</div>}
        </section>

        <section className="channels">
          <h2>Channels ({channels.length})</h2>
          {channels.length === 0 ? (
            <p className="empty">No channels yet</p>
          ) : (
            <div className="channel-list">
              {channels.map((channel) => (
                <div key={channel.id} className="channel-card">
                  <div className="channel-info">
                    <h3>
                      {channel.type === 'podbbang' && <span className="platform-badge podbbang">Podbbang</span>}
                      {(!channel.type || channel.type === 'youtube') && <span className="platform-badge youtube">YouTube</span>}
                      {channel.title}
                    </h3>
                    <p className="channel-url">{channel.url}</p>
                    <p className="channel-meta">
                      {channel.videos.length} episodes · Added {new Date(channel.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="channel-actions">
                    {(!channel.type || channel.type === 'youtube') && (
                      <button
                        onClick={() => handleDownload(channel.id)}
                        disabled={downloadingChannels.has(channel.id)}
                        className="btn-download"
                      >
                        {downloadingChannels.has(channel.id) ? 'Downloading...' : 'Download'}
                      </button>
                    )}
                    <button onClick={() => copyRssUrl(channel.id)} className="btn-rss">
                      Copy RSS
                    </button>
                    <button onClick={() => handleDeleteChannel(channel.id, channel.title)} className="btn-delete">
                      Delete
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
