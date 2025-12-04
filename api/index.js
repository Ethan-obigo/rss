import app from '../server.js';

// Vercel 서버리스 함수 핸들러
export default async function handler(req, res) {
  return app(req, res);
}
