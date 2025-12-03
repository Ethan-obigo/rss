# yt-rss-maker

YouTube 채널을 RSS 피드로 변환하고, 오디오를 추출하여 차량용 팟캐스트 앱에서 사용할 수 있도록 하는 서버입니다.

## 기능

- YouTube 채널의 영상 목록 자동 수집
- 영상에서 오디오 추출 (MP3)
- 표준 RSS 2.0 피드 생성
- `<enclosure>` 태그로 오디오 파일 제공
- 차량 오디오 시스템에서 재생 가능

## 설치

### 1. yt-dlp 설치 (필수)

#### Windows
```bash
winget install yt-dlp
```

#### Mac
```bash
brew install yt-dlp
```

#### Linux
```bash
sudo apt install yt-dlp
```

### 2. 프로젝트 설치
```bash
cd yt-rss-maker
npm install
```

## 사용법

### 1. 서버 시작
```bash
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 2. YouTube 채널 추가

```bash
curl -X POST http://localhost:3000/api/channel \
  -H "Content-Type: application/json" \
  -d '{
    "channelUrl": "https://www.youtube.com/@username",
    "limit": 10
  }'
```

응답 예시:
```json
{
  "success": true,
  "channel": {
    "id": "UCrAhzG4rf642oTUCpdyo5Vw",
    "title": "Channel UCrAhzG4rf642oTUCpdyo5Vw"
  },
  "videos": 10,
  "message": "Found 10 videos. Use /api/download/:channelId to download audio."
}
```

### 3. 오디오 다운로드

```bash
curl -X POST http://localhost:3000/api/download/UCrAhzG4rf642oTUCpdyo5Vw
```

응답 예시:
```json
{
  "success": true,
  "downloaded": 10,
  "failed": 0,
  "results": [...]
}
```

### 4. RSS 피드 확인

브라우저에서 접속:
```
http://localhost:3000/rss/UCrAhzG4rf642oTUCpdyo5Vw
```

RSS XML 예시:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Channel Name</title>
    <item>
      <title>영상 제목</title>
      <link>https://www.youtube.com/watch?v=VIDEO_ID</link>
      <enclosure url="http://localhost:3000/audio/VIDEO_ID.mp3" type="audio/mpeg"/>
      <pubDate>Sat, 16 Nov 2025 12:00:43 GMT</pubDate>
    </item>
  </channel>
</rss>
```

### 5. 차량 앱에서 구독

차량의 팟캐스트/RSS 리더 앱에서:
```
http://yourserver.com:3000/rss/CHANNEL_ID
```

## API 엔드포인트

### GET `/api/health`
서버 상태 확인

### GET `/api/channels`
등록된 모든 채널 목록

### POST `/api/channel`
새 채널 추가 및 영상 목록 가져오기

Body:
```json
{
  "channelUrl": "https://www.youtube.com/@username",
  "limit": 10
}
```

### POST `/api/download/:channelId`
채널의 모든 영상에서 오디오 추출

### GET `/rss/:channelId`
RSS 피드 XML 제공

## 디렉토리 구조

```
yt-rss-maker/
├── server.js           # 메인 서버
├── lib/
│   ├── ytDownloader.js # YouTube 다운로드 로직
│   ├── rssGenerator.js # RSS 생성
│   └── channelDB.js    # 간단한 JSON DB
├── storage/
│   ├── audio/          # 추출된 MP3 파일
│   └── channels.json   # 채널 데이터
└── package.json
```

## 배포

### 환경 변수
```bash
PORT=3000
BASE_URL=http://yourdomain.com:3000
```

### 프로덕션 실행
```bash
NODE_ENV=production npm start
```

## 법적 고지

이 도구는 **크리에이터의 명시적 동의**를 받은 경우에만 사용하세요.
YouTube 서비스 약관을 준수하며, 무단 콘텐츠 다운로드는 법적 문제가 될 수 있습니다.

## 라이선스

ISC
