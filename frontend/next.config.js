/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://xiaoyou-ky.top/api/:path*'
          : 'http://localhost:8080/api/:path*'
      }
    ];
  }
};
module.exports = nextConfig;
