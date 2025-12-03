// supabaseService.js

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET_NAME } from './constants.js';
import * as fs from 'fs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 로컬 파일을 Supabase Storage에 업로드합니다.
 * @param {string} localFilePath - 로컬 MP3 파일 경로
 * @param {string} storageFileKey - Supabase 버킷에 저장될 최종 파일 이름 (예: 'episodes/ep168.mp3')
 * @returns {Promise<string>} Supabase에 저장된 파일의 공개 URL
 */
export async function uploadToSupabase(localFilePath, storageFileKey) {
  // 1. 로컬 파일 내용을 Buffer 형태로 읽어옵니다.
  const fileContent = fs.readFileSync(localFilePath);

  // 2. Supabase Storage에 파일 업로드 실행
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storageFileKey, fileContent, {
      contentType: 'audio/mpeg', // MP3 파일임을 명시
      upsert: true, // 파일이 이미 있으면 덮어쓰기
    });

  if (error) {
    console.error('Supabase 업로드 실패:', error);
    throw new Error(`Supabase 업로드 오류: ${error.message}`);
  }

  // 3. 업로드된 파일의 공개 URL 생성 및 반환
  // (공개 버킷이므로 URL은 예측 가능합니다.)
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storageFileKey}`;

  return publicUrl;
}
