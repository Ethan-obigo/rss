const API_BASE = '/api';

export async function getChannels() {
  const response = await fetch(`${API_BASE}/channels`);
  return response.json();
}

export async function addYouTubeChannel(url) {
  const response = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  return response.json();
}

export async function deleteChannel(channelId) {
  const response = await fetch(`${API_BASE}/channel/${channelId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function addPodbbangChannel(channelId) {
  const response = await fetch(`${API_BASE}/podbbang/channel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channelId }),
  });
  return response.json();
}

export async function addSpotifyShow(showUrl) {
  // showUrl에서 showId 추출
  const showIdMatch = showUrl.match(/show\/([a-zA-Z0-9]+)/);
  const showId = showIdMatch ? showIdMatch[1] : showUrl;

  const response = await fetch(`${API_BASE}/spotify/show`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ showId }),
  });
  return response.json();
}

export function getRssUrl(channelId) {
  return `${window.location.origin}/rss/${channelId}`;
}
