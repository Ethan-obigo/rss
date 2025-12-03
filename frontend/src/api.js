const API_BASE = '/api';

export async function getChannels() {
  const response = await fetch(`${API_BASE}/channels`);
  const data = await response.json();
  return data.channels;
}

export async function addChannel(channelUrl, limit = 10) {
  const response = await fetch(`${API_BASE}/channel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channelUrl, limit }),
  });
  return response.json();
}

export async function downloadChannel(channelId) {
  const response = await fetch(`${API_BASE}/download/${channelId}`);
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

export function getRssUrl(channelId) {
  return `${window.location.origin}/rss/${channelId}`;
}
