/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    const publicApi = process.env.NEXT_PUBLIC_API_URL;
    const backend = (process.env.API_INTERNAL_URL || (publicApi?.startsWith('http') ? publicApi : 'http://localhost:4000/api')).replace(/\/api\/?$/, '').replace(/\/$/, '');
    return [
      { source: '/uploads/:path*', destination: `${backend}/uploads/:path*` },
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
