
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */

  // Use slim PostHog build — strips replay, surveys, toolbar
  turbopack: {
    resolveAlias: {
      'posthog-js': 'posthog-js/dist/module.no-external.js',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // This is needed to allow cross-origin requests in development.
  // The development environment runs in a container, and the preview
  // is served from a different origin.
  allowedDevOrigins: ['https://*.cloudworkstations.dev'],

  // PostHog reverse proxy — bypasses ad blockers for ~30% more events
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
};

export default nextConfig;
