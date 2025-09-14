# Right Now - Netlify 배포 가이드

## 🚀 배포 준비사항

### 1. Supabase 데이터베이스 설정
Supabase 대시보드에서 다음 SQL을 실행해주세요:

```sql
-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel VARCHAR(50) NOT NULL,
  chat_id VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  password VARCHAR(8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_channel ON posts(channel);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to posts" ON posts FOR DELETE USING (true);

CREATE POLICY "Allow public insert access to feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to feedback" ON feedback FOR SELECT USING (true);
```

### 2. Resend 이메일 서비스 설정
1. [Resend.com](https://resend.com)에서 계정 생성
2. API 키 발급
3. 도메인 인증 (선택사항)

## 📦 Netlify 배포 방법

### 방법 1: Git 연동 배포 (권장)

1. **GitHub에 코드 업로드**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/right-now-app.git
   git push -u origin main
   ```

2. **Netlify에서 사이트 생성**
   - [Netlify](https://netlify.com)에 로그인
   - "New site from Git" 클릭
   - GitHub 저장소 선택
   - 빌드 설정:
     - Build command: `npm run build`
     - Publish directory: `.next`
     - Node version: 18

3. **환경변수 설정**
   Netlify 대시보드 > Site settings > Environment variables에서 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://yubnlqdboiamaoxkisjl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_MlCDY953SXcbwMwjdIqtrQ_3_gOK9Bv
   RESEND_API_KEY=re_CtuK4zBQ_71x6wHxqWVcu7gz5jhMukeeW
   ADMIN_PASSWORD=!QAZ2wsx
   ```

### 방법 2: 수동 배포

1. **로컬에서 빌드**
   ```bash
   npm run build
   ```

2. **Netlify에 수동 업로드**
   - Netlify 대시보드에서 "Deploy manually" 선택
   - `.next` 폴더를 드래그 앤 드롭

## ⚙️ 배포 후 설정

### 1. 도메인 설정
- Netlify에서 자동 생성된 도메인 사용
- 또는 커스텀 도메인 연결

### 2. 환경변수 확인
- 모든 환경변수가 올바르게 설정되었는지 확인
- 특히 Supabase URL과 키가 정확한지 확인

### 3. 기능 테스트
- 포스트 작성/수정/삭제 기능
- 피드백 전송 기능
- 관리자 패널 접근 (환경변수로 관리되는 비밀번호)
- 세션 기반 인증 시스템

## 🔧 문제 해결

### 빌드 오류
- Node.js 버전을 18로 설정
- `npm install` 실행 후 다시 빌드

### API 오류
- Supabase 연결 확인
- 환경변수 설정 확인
- CORS 설정 확인

### 이메일 전송 오류
- Resend API 키 확인
- 도메인 인증 상태 확인

## 📱 관리자 기능

### 관리자 패널 접근
- URL: `https://your-site.netlify.app/admin`
- 비밀번호: `!QAZ2wsx`

### 관리 기능
- 포스트 관리 (검색, 삭제)
- 피드백 관리 (검색, 삭제)
- 실시간 데이터 확인

## 🚀 성능 최적화

### 이미지 최적화
- `next.config.mjs`에서 `images: { unoptimized: true }` 설정
- 정적 이미지 사용

### 빌드 최적화
- `output: 'export'` 설정으로 정적 사이트 생성
- 불필요한 의존성 제거

## 📊 모니터링

### Netlify Analytics
- 사이트 성능 모니터링
- 방문자 통계 확인

### Supabase 대시보드
- 데이터베이스 사용량 모니터링
- API 호출 통계 확인

## 🔒 보안 고려사항

### 환경변수 보안
- 민감한 정보는 환경변수로 관리
- API 키 노출 방지

### 데이터베이스 보안
- RLS (Row Level Security) 활성화
- 적절한 정책 설정

### 관리자 인증
- 강력한 비밀번호 사용
- 정기적인 비밀번호 변경

---

## 📞 지원

문제가 발생하면 다음을 확인해주세요:
1. Supabase 데이터베이스 연결 상태
2. 환경변수 설정
3. Netlify 빌드 로그
4. 브라우저 콘솔 오류

성공적인 배포를 위해 위 단계를 순서대로 따라해주세요! 🎉
