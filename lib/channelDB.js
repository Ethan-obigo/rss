import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Supabase 기반 채널 DB
 */
class ChannelDB {
  /**
   * 채널 추가
   */
  async addChannel(channel) {
    // 이미 존재하는지 확인
    const { data: existing } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel.id)
      .single();

    if (existing) {
      return this.formatChannel(existing);
    }

    const newChannel = {
      id: channel.id,
      title: channel.title,
      url: channel.url,
      thumbnail: channel.thumbnail || null,
      type: channel.type || 'youtube',
      videos: [],
      description: channel.description || null,
      summary: channel.summary || null,
      author: channel.author || null,
      copyright: channel.copyright || null,
      owner: channel.owner || null,
      language: channel.language || 'ko',
      added_at: new Date().toISOString(),
      last_update: null
    };

    const { data, error } = await supabase
      .from('channels')
      .insert([newChannel])
      .select()
      .single();

    if (error) {
      console.error('Failed to add channel:', error);
      throw new Error(error.message);
    }

    return this.formatChannel(data);
  }

  /**
   * 모든 채널 가져오기
   */
  async getAllChannels() {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Failed to get channels:', error);
      throw new Error(error.message);
    }

    return data.map(this.formatChannel);
  }

  /**
   * 특정 채널 가져오기
   */
  async getChannel(channelId) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Failed to get channel:', error);
      throw new Error(error.message);
    }

    return this.formatChannel(data);
  }

  /**
   * 채널 영상 목록 업데이트
   */
  async updateChannelVideos(channelId, videos) {
    const { data, error } = await supabase
      .from('channels')
      .update({
        videos: videos,
        last_update: new Date().toISOString()
      })
      .eq('id', channelId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update channel videos:', error);
      throw new Error(error.message);
    }

    return this.formatChannel(data);
  }

  /**
   * 채널 삭제
   */
  async deleteChannel(channelId) {
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId);

    if (error) {
      console.error('Failed to delete channel:', error);
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * DB 데이터를 기존 형식으로 변환
   */
  formatChannel(data) {
    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      url: data.url,
      thumbnail: data.thumbnail,
      type: data.type,
      addedAt: data.added_at,
      lastUpdate: data.last_update,
      videos: data.videos || [],
      description: data.description,
      summary: data.summary,
      author: data.author,
      copyright: data.copyright,
      owner: data.owner,
      language: data.language
    };
  }
}

export default new ChannelDB();
