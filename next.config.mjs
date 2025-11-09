import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    ignoreBuildErrors: true, // Set to false in production
  },
  images: {
    unoptimized: true, // Enable optimization in production
    domains: ['*.supabase.co', '*.supabase.in'],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Security headers (also handled in middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ]
  },
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
  },
}

export default nextConfig
