// start.js 파일 내용

import app from './server.js'; // server.js에서 Express 앱 객체(app)를 가져옵니다.
import 'dotenv/config'; // 환경 변수 로드
import { Server } from 'http'; // (선택 사항) http 모듈의 Server 객체를 명시적으로 가져옵니다.

// 1. 환경 변수 설정
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

console.log('Attempting to start server...');

// 2. 서버 시작
// Express 앱 객체(app)에 .listen() 메서드를 호출하여 HTTP 서버를 구동합니다.
const server = app.listen(PORT, () => {
    console.log(`✅ YouTube RSS Maker running on ${BASE_URL}`);
});

// 3. 서버가 멈추지 않도록 오류 핸들링 추가
// Express 서버는 .listen()이 호출된 후 클라이언트 요청을 기다리는 동안
// 프로세스를 종료하지 않고 계속 유지합니다.

// 3-1. 처리되지 않은 예외(Uncaught Exception) 발생 시 프로세스 유지를 시도
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // 운영 환경에서는 보통 process.exit(1)로 종료하는 것이 권장되지만,
    // 여기서는 개발 및 디버깅을 위해 서버를 유지합니다.
});

// 3-2. 처리되지 않은 Promise 오류(Unhandled Rejection) 발생 시 프로세스 유지를 시도
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // 로그만 남기고 서버 프로세스를 유지합니다.
});

// 추가: 서버 종료(shutdown) 시 처리 (선택 사항)
function handleShutdown(signal) {
    console.log(`\n🚨 Received signal ${signal}. Closing HTTP server.`);
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));