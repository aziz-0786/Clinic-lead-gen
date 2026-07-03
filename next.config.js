/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,           // gzip all responses
  poweredByHeader: false,   // don't leak server info
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'], // serve modern formats
    minimumCacheTTL: 86400,                // cache optimised images 24h
  },

  // Long-lived caching for static assets and images on Vercel CDN
  async headers() {
    return [
      {
        source: '/images/:all*(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/vid.mp4',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
    ];
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/,
      type: 'asset/resource',
      generator: { filename: 'static/media/[name][ext]' },
    });
    return config;
  },
};

module.exports = nextConfig;
