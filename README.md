# RSS 피드 생성기 (Frontend)

YouTube, 팟빵, Spotify를 RSS 피드로 변환하는 웹 애플리케이션의 프론트엔드입니다.

## 기능

- ✅ **YouTube**: 채널/플레이리스트 URL 입력 → 자동 오디오 추출 및 RSS 생성
- ✅ **팟빵**: 채널 ID 또는 URL 입력 → RSS 생성
- ✅ **Spotify**: 쇼 URL 입력 → RSS 생성 (메타데이터만)

## 기술 스택

- **프론트엔드**: React 19 + Vite
- **백엔드**: NestJS (별도 레포지토리)
- **스타일링**: CSS

## 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

프론트엔드: http://localhost:5173

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물: `dist/`

## 프로젝트 구조

```
yt-rss-maker/
├── src/
│   ├── App.jsx           # 메인 컴포넌트
│   ├── api.js            # API 호출 함수
│   ├── App.css           # 스타일
│   └── main.jsx          # 엔트리 포인트
├── public/               # 정적 파일
├── dist/                 # 빌드 결과물
├── index.html            # HTML 템플릿
├── vite.config.js        # Vite 설정
├── package.json
└── README.md
```
