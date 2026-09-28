# SSH BAND — 멤버 모집 & 익명 게시판

React/Vite 화면과 Express API를 하나의 Node.js 서비스로 제공합니다. 게시글은 PostgreSQL에 저장되며 서버는 런타임 `DATABASE_URL`만 사용합니다.

## 실행

```bash
npm ci
npm run build
npm start
```

서비스는 `PORT` 환경변수를 사용하며 기본 포트는 `4173`입니다. `DATABASE_URL`이 없거나 데이터베이스에 연결할 수 없으면 서버는 시작되지 않습니다. TLS/SSL은 별도 옵션을 강제하지 않습니다.

개발 시 프런트엔드는 `npm run dev`로 실행하고, API와 정적 파일 서버는 별도 터미널에서 `npm start`로 실행하세요. Vite 개발 서버의 `/api` 요청은 `127.0.0.1:4173`으로 프록시됩니다.

## API

- `GET /api/health` — 데이터베이스 연결 상태 확인
- `GET /api/posts` — 최근 게시글 목록
- `GET /api/posts/:id` — 게시글 상세
- `POST /api/posts` — 익명 게시글 작성 (`title`, `body`, 선택적 `isAnonymous`)

최초 실행 때 `posts` 테이블과 정렬 인덱스를 `IF NOT EXISTS`로 준비합니다. 게시글은 제목 100자, 본문 5,000자까지이며 계정·이름·연락처를 요청하거나 게시글에 저장하지 않습니다. rate limit 키 계산에 접속 IP를 메모리에서 일시적으로 사용하며 데이터베이스에는 기록하지 않습니다.

## 검증

```bash
npm run lint
npm test
npm run build
```
