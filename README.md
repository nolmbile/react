# React Deploy Test

Vite와 React로 만든 간단한 배포 테스트 페이지입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 배포 설정

### Vercel

GitHub 저장소를 연결하면 Vite 프로젝트를 자동으로 인식합니다.

- Build command: `npm run build`
- Output directory: `dist`

### Railway

GitHub 저장소를 연결하면 `npm start`로 빌드 결과물을 실행할 수 있습니다.

- Build command: `npm run build`
- Start command: `npm start`

별도의 환경 변수는 필요하지 않습니다.
