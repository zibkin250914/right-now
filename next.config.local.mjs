/** @type {import('next').NextConfig} */
const nextConfig = {
  // 로컬 개발용 설정 - API 라우트 사용
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
