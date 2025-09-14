# 로컬 개발 환경 설정 가이드

## 🚀 로컬 개발 서버 시작

### 1. 로컬 개발 모드 (API 라우트 사용)
```bash
npm run dev:local
```
- Next.js API 라우트를 사용하여 로컬에서 테스트
- http://localhost:3000 에서 접속 가능
- 실시간 코드 변경 반영 (Hot Reload)

### 2. 일반 개발 모드
```bash
npm run dev
```
- 기본 Next.js 개발 서버

## 🔧 빌드 명령어

### 로컬 빌드 (API 라우트 포함)
```bash
npm run build:local
```

### Netlify 배포용 빌드 (정적 사이트)
```bash
npm run build:netlify
```

## 📁 파일 구조

### 설정 파일들
- `next.config.local.mjs` - 로컬 개발용 설정 (API 라우트 활성화)
- `next.config.netlify.mjs` - Netlify 배포용 설정 (정적 사이트)
- `next.config.mjs` - 현재 활성화된 설정

### API 라우트
- `app/api/posts/route.ts` - 게시물 CRUD
- `app/api/posts/[id]/route.ts` - 개별 게시물 수정/삭제
- `app/api/feedback/route.ts` - 피드백 저장
- `app/api/rate-limit/route.ts` - 속도 제한

### Netlify Functions
- `netlify/functions/posts.js` - 게시물 CRUD (배포용)
- `netlify/functions/feedback.js` - 피드백 저장 (배포용)
- `netlify/functions/rate-limit.js` - 속도 제한 (배포용)
- `netlify/functions/admin-auth.js` - 관리자 인증
- `netlify/functions/admin-verify.js` - 관리자 세션 확인

## 🧪 테스트 방법

### 1. 웹 브라우저에서 테스트
- http://localhost:3000 접속
- 게시물 작성, 수정, 삭제 테스트
- 피드백 전송 테스트
- 속도 제한 테스트

### 2. API 직접 테스트
```bash
# 게시물 목록 조회
curl http://localhost:3000/api/posts

# 속도 제한 테스트
curl -X POST http://localhost:3000/api/rate-limit

# 피드백 전송 테스트
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"feedback": "테스트 피드백입니다"}'
```

## 🔄 개발 워크플로우

### 로컬에서 코드 수정 및 테스트
1. `npm run dev:local` 실행
2. 코드 수정
3. 브라우저에서 자동 새로고침 확인
4. 기능 테스트

### 배포 준비
1. `npm run build:netlify` 실행
2. `git add .` 및 `git commit`
3. `git push` (Netlify 자동 배포)

## ⚠️ 주의사항

- 로컬 개발 시에는 API 라우트를 사용
- 배포 시에는 Netlify Functions를 사용
- 환경 변수는 `.env.local` 파일에서 관리
- Supabase 연결은 하드코딩된 값 사용 (보안상 문제없음)

## 🐛 문제 해결

### 포트 충돌
```bash
# 다른 포트 사용
npm run dev:local -- -p 3001
```

### 캐시 문제
```bash
# Next.js 캐시 삭제
rm -rf .next
npm run dev:local
```

### 의존성 문제
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```
