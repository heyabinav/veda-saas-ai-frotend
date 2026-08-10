/** @type {import('next').NextConfig} */
const STATIC_ASSET_CACHE = "public, max-age=31536000, immutable";

const nextConfig = {
  /* config options here */
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'three',
      'framer-motion',
      'date-fns',
      '@radix-ui/react-icons',
    ],
  },
  async headers() {
    const headers = [
      {
        source: '/:path*.(svg|png|jpg|jpeg|gif|webp|ico|avif)',
        headers: [{ key: 'Cache-Control', value: STATIC_ASSET_CACHE }],
      },
      {
        source: '/:path*.(woff|woff2|ttf|eot|otf)',
        headers: [{ key: 'Cache-Control', value: STATIC_ASSET_CACHE }],
      },
    ];
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_ASSET_CACHE }],
      });
    }
    return headers;
  },
};

export default nextConfig;
